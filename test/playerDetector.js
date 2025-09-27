const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Configuration
const API_KEY = "Imm66rNLdtpVKJSwH4Cl";
const API_URL = "https://serverless.roboflow.com/all-football/1";

// Test function
async function testFootballDetection(imagePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        console.log(`🏈 Testing football detection on: ${imagePath}`);
        console.log("📤 Uploading image...");

        // Read and encode image
        const image = fs.readFileSync(imagePath, {
            encoding: "base64"
        });

        // Make API request
        const response = await axios({
            method: "POST",
            url: API_URL,
            params: {
                api_key: API_KEY
            },
            data: image,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // Process results
        const predictions = response.data.predictions;
        console.log("\n✅ Detection completed successfully!");
        console.log(`📊 Found ${predictions.length} detections`);
        
        // Summary by class
        const summary = {};
        predictions.forEach(pred => {
            if (!summary[pred.class]) {
                summary[pred.class] = { count: 0, avgConfidence: 0 };
            }
            summary[pred.class].count++;
            summary[pred.class].avgConfidence += pred.confidence;
        });

        console.log("\n📈 Detection Summary:");
        Object.keys(summary).forEach(className => {
            const avg = (summary[className].avgConfidence / summary[className].count).toFixed(3);
            console.log(`   ${className}: ${summary[className].count} detections (avg confidence: ${avg})`);
        });

        // Top 5 highest confidence detections
        const topDetections = predictions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);

        console.log("\n🎯 Top 5 Detections:");
        topDetections.forEach((detection, index) => {
            console.log(`   ${index + 1}. ${detection.class} - ${(detection.confidence * 100).toFixed(1)}% confidence`);
            console.log(`      Position: (${detection.x}, ${detection.y}) Size: ${detection.width}x${detection.height}`);
        });

        // Save results to file
        const outputFile = `detection_results_${Date.now()}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
        console.log(`\n💾 Full results saved to: ${outputFile}`);

        return response.data;

    } catch (error) {
        console.error("❌ Error during detection:");
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data}`);
        } else {
            console.error(`   ${error.message}`);
        }
        throw error;
    }
}

// Batch testing function
async function testMultipleImages(imageFolder) {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.bmp'];
    
    try {
        const files = fs.readdirSync(imageFolder)
            .filter(file => supportedExtensions.includes(path.extname(file).toLowerCase()))
            .map(file => path.join(imageFolder, file));

        if (files.length === 0) {
            console.log("❌ No supported image files found in the folder");
            return;
        }

        console.log(`🔄 Testing ${files.length} images from folder: ${imageFolder}\n`);
        
        const results = [];
        for (let i = 0; i < files.length; i++) {
            console.log(`\n--- Test ${i + 1}/${files.length} ---`);
            try {
                const result = await testFootballDetection(files[i]);
                results.push({ file: files[i], success: true, result });
                
                // Add delay between requests to avoid rate limiting
                if (i < files.length - 1) {
                    console.log("⏳ Waiting 2 seconds before next request...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                results.push({ file: files[i], success: false, error: error.message });
            }
        }

        // Overall summary
        const successful = results.filter(r => r.success).length;
        console.log(`\n🏆 Batch Test Complete: ${successful}/${files.length} successful`);

    } catch (error) {
        console.error("❌ Error reading image folder:", error.message);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log("🏈 Football Detection Test Script");
        console.log("\nUsage:");
        console.log("  node test_script.js <image_path>           # Test single image");
        console.log("  node test_script.js <folder_path> --batch  # Test all images in folder");
        console.log("\nExamples:");
        console.log("  node test_script.js football_game.jpg");
        console.log("  node test_script.js ./images --batch");
        return;
    }

    const targetPath = args[0];
    const isBatch = args.includes('--batch');

    if (isBatch) {
        await testMultipleImages(targetPath);
    } else {
        await testFootballDetection(targetPath);
    }
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error("💥 Script failed:", error.message);
        process.exit(1);
    });
}

module.exports = { testFootballDetection, testMultipleImages };