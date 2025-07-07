
import { useConversation } from '@11labs/react';
import { useState, useCallback, useEffect } from 'react';

export interface ConversationState {
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  error: string | null;
  conversationId: string | null;
}

export const useElevenLabsConversation = () => {
  const [state, setState] = useState<ConversationState>({
    isConnected: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    conversationId: null,
  });

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setState(prev => ({ ...prev, isConnected: true, isLoading: false, error: null }));
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isLoading: false, 
        conversationId: null 
      }));
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      // Add message to transcript
      if (message.type === 'user_transcript' && message.user_transcript) {
        setMessages(prev => [...prev, { role: 'user', content: message.user_transcript }]);
      } else if (message.type === 'agent_response' && message.agent_response) {
        setMessages(prev => [...prev, { role: 'assistant', content: message.agent_response }]);
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Connection error occurred',
        isLoading: false 
      }));
    },
  });

  // Track speaking state
  useEffect(() => {
    setState(prev => ({ ...prev, isSpeaking: conversation.isSpeaking }));
  }, [conversation.isSpeaking]);

  const startConversation = useCallback(async (agentId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // For demo purposes, we'll use a mock URL
      // In production, you'd generate a signed URL from your backend
      const mockUrl = `https://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
      
      const conversationId = await conversation.startSession({ 
        agentId: agentId 
      });
      
      setState(prev => ({ 
        ...prev, 
        conversationId,
        isLoading: false 
      }));
      
      console.log('Conversation started with ID:', conversationId);
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to start conversation',
        isLoading: false 
      }));
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setMessages([]);
    } catch (error: any) {
      console.error('Failed to end conversation:', error);
    }
  }, [conversation]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
    } catch (error: any) {
      console.error('Failed to set volume:', error);
    }
  }, [conversation]);

  return {
    ...state,
    messages,
    startConversation,
    endConversation,
    setVolume,
    status: conversation.status,
  };
};
