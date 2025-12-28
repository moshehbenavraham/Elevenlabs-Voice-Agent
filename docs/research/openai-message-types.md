# OpenAI Realtime API Message Types

**Session**: phase01-session01-openai-research
**Created**: 2025-12-28
**Status**: Research Complete

---

## Overview

The OpenAI Realtime API uses a bidirectional event protocol with:
- **9 Client Events** (sent by client to server)
- **28+ Server Events** (sent by server to client)

All events are JSON objects with a `type` field.

---

## Client Events (9 Total)

### 1. session.update

Updates session configuration. Can be sent at any time.

```json
{
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "instructions": "You are a helpful assistant.",
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": {
      "model": "whisper-1"
    },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 200
    },
    "tools": [],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_response_output_tokens": "inf"
  }
}
```

**Notes**: Voice and model cannot be changed after session creation.

---

### 2. input_audio_buffer.append

Appends audio bytes to the input buffer.

```json
{
  "type": "input_audio_buffer.append",
  "audio": "<base64_encoded_pcm16_audio>"
}
```

**Notes**: Audio should be ~100ms chunks for optimal streaming.

---

### 3. input_audio_buffer.commit

Commits the audio buffer, creating a user message item.

```json
{
  "type": "input_audio_buffer.commit"
}
```

**Notes**: Not needed when using server VAD (auto-commits on silence).

---

### 4. input_audio_buffer.clear

Clears pending audio in the buffer.

```json
{
  "type": "input_audio_buffer.clear"
}
```

---

### 5. response.create

Triggers response generation. Optional in server VAD mode.

```json
{
  "type": "response.create",
  "response": {
    "modalities": ["text", "audio"],
    "instructions": "Override instructions for this response",
    "voice": "alloy",
    "output_audio_format": "pcm16",
    "tools": [],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_response_output_tokens": 4096
  }
}
```

**Notes**: Parameters override session defaults for this response only.

---

### 6. response.cancel

Cancels an in-progress response.

```json
{
  "type": "response.cancel"
}
```

---

### 7. conversation.item.create

Adds a new item to conversation context.

```json
{
  "type": "conversation.item.create",
  "previous_item_id": "item_123",
  "item": {
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Hello, how are you?"
      }
    ]
  }
}
```

**Item Types**: `message`, `function_call`, `function_call_output`
**Roles**: `system`, `user`, `assistant`
**Content Types**: `input_text`, `input_audio`, `text`, `audio`

---

### 8. conversation.item.truncate

Truncates assistant audio message.

```json
{
  "type": "conversation.item.truncate",
  "item_id": "item_456",
  "content_index": 0,
  "audio_end_ms": 2500
}
```

**Notes**: Used when user interrupts assistant.

---

### 9. conversation.item.delete

Removes an item from conversation.

```json
{
  "type": "conversation.item.delete",
  "item_id": "item_789"
}
```

---

## Server Events (28+ Total)

### Session Events

#### session.created

First event after connection.

```json
{
  "type": "session.created",
  "session": {
    "object": "realtime.session",
    "id": "sess_abc123",
    "model": "gpt-4o-realtime-preview",
    "modalities": ["text", "audio"],
    "instructions": "",
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5
    },
    "tools": [],
    "tool_choice": "auto",
    "temperature": 0.8
  }
}
```

#### session.updated

Session configuration updated.

```json
{
  "type": "session.updated",
  "session": {
    "id": "sess_abc123",
    "modalities": ["text", "audio"],
    "voice": "alloy"
  }
}
```

---

### Conversation Events

#### conversation.created

Conversation ready for messages.

```json
{
  "type": "conversation.created",
  "conversation": {
    "id": "conv_xyz789",
    "object": "realtime.conversation"
  }
}
```

#### conversation.item.created

New item added to conversation.

```json
{
  "type": "conversation.item.created",
  "previous_item_id": "item_123",
  "item": {
    "object": "realtime.item",
    "type": "message",
    "id": "item_456",
    "role": "user",
    "status": "completed",
    "content": []
  }
}
```

#### conversation.item.deleted

Item removed from conversation.

```json
{
  "type": "conversation.item.deleted",
  "item_id": "item_789"
}
```

#### conversation.item.truncated

Audio truncated.

```json
{
  "type": "conversation.item.truncated",
  "item_id": "item_456",
  "content_index": 0,
  "audio_end_ms": 2500
}
```

---

### Input Audio Buffer Events

#### input_audio_buffer.committed

Buffer committed successfully.

```json
{
  "type": "input_audio_buffer.committed",
  "previous_item_id": "item_123",
  "item_id": "item_456"
}
```

#### input_audio_buffer.cleared

Buffer cleared.

```json
{
  "type": "input_audio_buffer.cleared"
}
```

#### input_audio_buffer.speech_started

VAD detected speech start.

```json
{
  "type": "input_audio_buffer.speech_started",
  "audio_start_ms": 0,
  "item_id": "item_456"
}
```

#### input_audio_buffer.speech_stopped

VAD detected speech end.

```json
{
  "type": "input_audio_buffer.speech_stopped",
  "audio_end_ms": 1500,
  "item_id": "item_456"
}
```

---

### Transcription Events

#### conversation.item.input_audio_transcription.completed

User audio transcription complete.

```json
{
  "type": "conversation.item.input_audio_transcription.completed",
  "item_id": "item_456",
  "content_index": 0,
  "transcript": "Hello, how are you?"
}
```

#### conversation.item.input_audio_transcription.failed

Transcription failed.

```json
{
  "type": "conversation.item.input_audio_transcription.failed",
  "item_id": "item_456",
  "content_index": 0,
  "error": {
    "type": "transcription_error",
    "code": "audio_unintelligible",
    "message": "Could not transcribe audio"
  }
}
```

---

### Response Events

#### response.created

Response generation started.

```json
{
  "type": "response.created",
  "response": {
    "object": "realtime.response",
    "id": "resp_abc123",
    "status": "in_progress",
    "output": [],
    "usage": null
  }
}
```

#### response.done

Response complete.

```json
{
  "type": "response.done",
  "response": {
    "object": "realtime.response",
    "id": "resp_abc123",
    "status": "completed",
    "output": [
      {
        "object": "realtime.item",
        "type": "message",
        "id": "item_789",
        "role": "assistant",
        "content": [
          {
            "type": "audio",
            "transcript": "Hello! I'm doing well."
          }
        ]
      }
    ],
    "usage": {
      "total_tokens": 150,
      "input_tokens": 50,
      "output_tokens": 100
    }
  }
}
```

**Status Values**: `completed`, `cancelled`, `incomplete`, `failed`

---

### Audio Output Events

#### response.audio.delta

Audio chunk received.

```json
{
  "type": "response.audio.delta",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "delta": "<base64_encoded_audio_chunk>"
}
```

#### response.audio.done

Audio stream complete.

```json
{
  "type": "response.audio.done",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0
}
```

#### response.audio_transcript.delta

Audio transcript chunk.

```json
{
  "type": "response.audio_transcript.delta",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "delta": "Hello"
}
```

#### response.audio_transcript.done

Audio transcript complete.

```json
{
  "type": "response.audio_transcript.done",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "transcript": "Hello! I'm doing well, thank you."
}
```

---

### Text Output Events

#### response.text.delta

Text chunk received.

```json
{
  "type": "response.text.delta",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "delta": "Hello"
}
```

#### response.text.done

Text complete.

```json
{
  "type": "response.text.done",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "text": "Hello! I'm doing well, thank you."
}
```

---

### Function Call Events

#### response.function_call_arguments.delta

Function arguments streaming.

```json
{
  "type": "response.function_call_arguments.delta",
  "response_id": "resp_abc123",
  "item_id": "item_fn",
  "output_index": 0,
  "call_id": "call_123",
  "delta": "{\"location\": \"San"
}
```

#### response.function_call_arguments.done

Function arguments complete.

```json
{
  "type": "response.function_call_arguments.done",
  "response_id": "resp_abc123",
  "item_id": "item_fn",
  "output_index": 0,
  "call_id": "call_123",
  "arguments": "{\"location\": \"San Francisco\"}"
}
```

---

### Content Part Events

#### response.content_part.added

New content part started.

```json
{
  "type": "response.content_part.added",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "audio"
  }
}
```

#### response.content_part.done

Content part complete.

```json
{
  "type": "response.content_part.done",
  "response_id": "resp_abc123",
  "item_id": "item_789",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "audio",
    "transcript": "Hello!"
  }
}
```

---

### Output Item Events

#### response.output_item.added

New output item started.

```json
{
  "type": "response.output_item.added",
  "response_id": "resp_abc123",
  "output_index": 0,
  "item": {
    "object": "realtime.item",
    "type": "message",
    "id": "item_789"
  }
}
```

#### response.output_item.done

Output item complete.

```json
{
  "type": "response.output_item.done",
  "response_id": "resp_abc123",
  "output_index": 0,
  "item": {
    "object": "realtime.item",
    "type": "message",
    "id": "item_789",
    "role": "assistant"
  }
}
```

---

### Rate Limit Events

#### rate_limits.updated

Rate limit status update.

```json
{
  "type": "rate_limits.updated",
  "rate_limits": [
    {
      "name": "requests_per_min",
      "limit": 500,
      "remaining": 495,
      "reset_seconds": 60
    },
    {
      "name": "tokens_per_min",
      "limit": 90000,
      "remaining": 89500,
      "reset_seconds": 60
    }
  ]
}
```

---

### Error Event

#### error

Error occurred.

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_audio_format",
    "message": "Audio format not supported",
    "param": "input_audio_format",
    "event_id": "evt_123"
  }
}
```

**Error Types**: `invalid_request_error`, `server_error`, `rate_limit_error`, `authentication_error`

---

## Event Comparison: OpenAI vs xAI

### Shared Events (Used in XAIVoiceContext)

| Event | OpenAI | xAI | Notes |
|-------|--------|-----|-------|
| `session.created` | Yes | Yes | Same structure |
| `session.updated` | Yes | Yes | Same structure |
| `input_audio_buffer.speech_started` | Yes | Yes | Same structure |
| `input_audio_buffer.speech_stopped` | Yes | Yes | Same structure |
| `response.audio.delta` | Yes | Yes | Same structure |
| `response.audio.done` | Yes | Yes | Same structure |
| `response.done` | Yes | Yes | Same structure |
| `error` | Yes | Yes | Same structure |

### Recommended Handler Implementation

The OpenAI WebSocket message handler can follow the same switch pattern as xAI:

```typescript
switch (data.type) {
  case 'session.created':
    // Send session.update
    break;
  case 'session.updated':
    // Mark connected, start listening
    break;
  case 'input_audio_buffer.speech_started':
    // Update UI
    break;
  case 'input_audio_buffer.speech_stopped':
    // Update UI
    break;
  case 'response.audio.delta':
    // Decode and queue audio
    break;
  case 'response.audio.done':
    // Audio complete
    break;
  case 'response.done':
    // Response complete
    break;
  case 'error':
    // Handle error
    break;
}
```
