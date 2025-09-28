import os
from inference_sdk import InferenceHTTPClient
import script_w_yardage
import json
import defensive_coverage

def filter_overlapping_predictions(predictions, threshold=1.0):
    """
    Filters overlapping predictions based on proximity and confidence score.

    If the center points of two predictions are within the given threshold
    on both x and y axes, the one with the lower confidence score is discarded.
    """
    predictions_to_remove = set()
    preds_list = list(predictions)
    
    # Compare every prediction with every other prediction
    for i in range(len(preds_list)):
        for j in range(i + 1, len(preds_list)):
            pred1 = preds_list[i]
            pred2 = preds_list[j]

            # Check if they are close on both axes
            if abs(pred1['x'] - pred2['x']) <= threshold and abs(pred1['y'] - pred2['y']) <= threshold:
                # If they are close, mark the one with lower confidence for removal
                if pred1['confidence'] < pred2['confidence']:
                    predictions_to_remove.add(pred1['detection_id'])
                else:
                    predictions_to_remove.add(pred2['detection_id'])

    # Create a new list containing only the predictions that were not marked for removal
    filtered_predictions = [p for p in predictions if p['detection_id'] not in predictions_to_remove]
    
    return filtered_predictions

# Create the generated_content directory if it doesn't exist
base_output_dir = os.path.join(os.path.dirname(__file__), 'generated_content')
os.makedirs(base_output_dir, exist_ok=True)

CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="yZbcFKL4HirN2zbDStgm"
)

# Replace with your image path
input_dir = os.path.join(os.path.dirname(__file__), 'input_content')
files_in_input = sorted(os.listdir(input_dir))

if not files_in_input:
    raise ValueError("The 'input_content' directory is empty.")

for image_filename in files_in_input:
    # Skip non-image files
    if not image_filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        print(f"Skipping non-image file: {image_filename}")
        continue

    # Create a unique directory for this image's output
    image_name_without_ext = os.path.splitext(image_filename)[0]
    output_dir = os.path.join(base_output_dir, image_name_without_ext)

    # If content has already been generated, skip this image
    if os.path.exists(output_dir):
        print(f"Skipping {image_filename}, content already generated.")
        continue

    print(f"Processing {image_filename}...")
    os.makedirs(output_dir, exist_ok=True)

    image_path = os.path.join(input_dir, image_filename)
    result = CLIENT.infer(image_path, model_id="football-players-fom0k/11")
    
    # Filter out overlapping predictions with lower confidence
    filtered_preds = filter_overlapping_predictions(result['predictions'])
    result['predictions'] = filtered_preds

    # The result from Roboflow is a dictionary, which is what script_w_yardage expects.
    detection_data = result

    # Get the data needed for coordinate mapping
    all_detections = detection_data['predictions']
    players = [d for d in all_detections if script_w_yardage.is_player_position(d['class'])]

    # Calculate line of scrimmage and field dimensions for coordinate mapping
    line_of_scrimmage_x = script_w_yardage.estimate_line_of_scrimmage(players)
    field_dims = script_w_yardage.calculate_field_dimensions(all_detections, line_of_scrimmage_x, players)

    # Map coordinates and export to JSON
    mapped_data = script_w_yardage.map_coordinates(detection_data, line_of_scrimmage_x, field_dims)

    # Run defensive coverage analysis
    coverage_analysis = defensive_coverage.classify_coverage_v2(mapped_data)

    # Combine mapped data with coverage analysis
    mapped_data['coverage_analysis'] = coverage_analysis

    # Save the raw detection data to its own JSON file
    output_detection_path = os.path.join(output_dir, 'detection_data.json')
    with open(output_detection_path, 'w') as f:
        json.dump(detection_data, f, indent=2)
    print(f"  -> Saved raw detection data to: {output_detection_path}")

    # Save the combined data to output.json
    output_json_path = os.path.join(output_dir, 'output.json')
    with open(output_json_path, 'w') as f:
        json.dump(mapped_data, f, indent=2)
    print(f"  -> Saved mapped data and coverage analysis to: {output_json_path}")

    # Create and save the diagram in the generated_content directory
    fig, ax = script_w_yardage.create_football_diagram(detection_data)
    output_image_path = os.path.join(output_dir, 'american_football_play_diagram.png')
    fig.savefig(output_image_path, dpi=300, bbox_inches='tight')
    print(f"  -> Saved diagram to: {output_image_path}")

print("\nProcessing complete.")
