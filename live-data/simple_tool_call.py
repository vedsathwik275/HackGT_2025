from espn_langchain_tool import create_espn_tool
import dotenv
import os
dotenv.load_dotenv()

tool = create_espn_tool(gemini_api_key=os.getenv('GEMINI_API_KEY'))

response = tool._run(analyze_data=True, custom_prompt=input("Enter a prompt: "))

print(response)