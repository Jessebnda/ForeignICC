// services/apiService.ts
import axios from 'axios';

export async function fetchChatbotAnswer(params: { question: string; chatbotUrl: string }): Promise<string> {
  const { question, chatbotUrl } = params;
  try {
    const response = await axios.get(chatbotUrl, { params: { question } });
    return response.data.result || 'No se obtuvo respuesta.';
  } catch (error) {
    console.error(error);
    return 'Error al comunicarse con el chatbot.';
  }
}
