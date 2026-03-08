export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface Room {
  code: string;
  name: string;
  messages: Message[];
  members: string[];
}
