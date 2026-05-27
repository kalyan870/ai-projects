import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from audio.audio_handler import AudioHandler
from assistant.voice_assistant import VoiceAssistant
from memory.memory_manager import LocalMemory
from wakeword.detector import WakeWordDetector

def main():
    print("=" * 50)
    print("VOICE ASSISTANT - Offline AI Assistant")
    print("=" * 50)
    print("Commands: 'record' to speak, 'exit' to quit, 'history' to see conversation")
    print()

    audio_handler = AudioHandler()
    assistant = VoiceAssistant()
    memory = LocalMemory()
    wakeword = WakeWordDetector()

    user_id = "default"

    while True:
        try:
            cmd = input("\n> ").strip().lower()

            if cmd == "exit" or cmd == "quit":
                print("Goodbye!")
                break

            elif cmd == "record":
                audio = audio_handler.record_from_mic(5.0)
                audio_path = audio_handler.save_temp(audio)
                text = audio_handler.speech_to_text(audio_path)

                if text:
                    print(f"You said: {text}")
                    memory.add(user_id, f"User said: {text}")
                    response = assistant.process_query(text)
                    print(f"Assistant: {response}")
                    audio_handler.text_to_speech(response)
                    memory.add(user_id, f"Assistant responded: {response}")
                else:
                    print("Could not understand audio")

            elif cmd.startswith("ask "):
                text = cmd[4:]
                response = assistant.process_query(text)
                print(f"Assistant: {response}")
                audio_handler.text_to_speech(response)

            elif cmd == "history":
                for conv in assistant.get_history()[-10:]:
                    print(f"  You: {conv['user']}")
                    print(f"  AI:  {conv['assistant']}")
                    print()

            elif cmd.startswith("remember "):
                memory.add(user_id, cmd[9:])
                print("Remembered!")

            elif cmd.startswith("search "):
                results = memory.search(user_id, cmd[7:])
                for r in results:
                    print(f"  - {r['content']}")

            elif cmd == "clear":
                assistant.clear_history()
                print("History cleared")

            else:
                print("Commands: record, ask <text>, history, remember <text>, search <text>, clear, exit")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")

    memory.close()

if __name__ == "__main__":
    main()
