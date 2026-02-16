import os

def find_jsx_files_with_content(start_path):
    for root, dirs, files in os.walk(start_path):
        for file in files:
            if file.endswith(".jsx"):
                full_path = os.path.join(root, file)
                
                print("-" * 50)
                print(f"FILE: {full_path}")
                print("-" * 50)
                
                try:
                    # Using utf-8 encoding to avoid errors with special characters
                    with open(full_path, 'r', encoding='utf-8') as f:
                        print(f.read())
                except Exception as e:
                    print(f"Error reading file: {e}")
                
                print("\n") # Add spacing between files

if __name__ == "__main__":
    # Path to your TaskNexus client directory
    start_directory = r"C:\TEMP\hhhh\code-relay-foobar\task-nexus\client"
    
    find_jsx_files_with_content(start_directory)