# Unity VR Integration Guide

This guide explains how to integrate the VEFC Vocational Expert Chatbot API into your Unity VR/XR project.

## API Overview

The chatbot provides vocational rehabilitation expertise including:
- DOT codes and job classifications
- Physical demands analysis
- Michael's case study information
- Training requirements and SVP levels

---

## API Endpoint

```
POST {YOUR_API_URL}/api/chat
Content-Type: application/json
```

---

## Request Format

```json
{
  "messages": [
    { "role": "user", "content": "Your question here" }
  ],
  "stream": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `messages` | Array | Array of message objects |
| `messages[].role` | String | Always `"user"` for questions |
| `messages[].content` | String | The question text |
| `stream` | Boolean | Set to `false` for Unity (streaming not needed) |

---

## Response Format

```json
{
  "content": "The answer from the AI assistant...",
  "sources": [
    {
      "fileName": "Document Name.pdf",
      "content": "Preview of source content..."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `content` | String | The AI-generated answer |
| `sources` | Array | Documents used to generate the answer |
| `sources[].fileName` | String | Name of the source document |
| `sources[].content` | String | Preview snippet from the document |

---

## Unity C# Implementation

### Basic Chatbot Script

Create a new C# script called `VEFCChatbot.cs`:

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

public class VEFCChatbot : MonoBehaviour
{
    [Header("API Configuration")]
    [SerializeField] private string apiUrl = "{YOUR_API_URL}/api/chat";

    [Header("Events")]
    public System.Action<string> OnResponseReceived;
    public System.Action<string> OnError;

    // Serializable classes for JSON
    [System.Serializable]
    private class Message
    {
        public string role;
        public string content;
    }

    [System.Serializable]
    private class ChatRequest
    {
        public Message[] messages;
        public bool stream = false;
    }

    [System.Serializable]
    private class Source
    {
        public string fileName;
        public string content;
    }

    [System.Serializable]
    private class ChatResponse
    {
        public string content;
        public Source[] sources;
    }

    /// <summary>
    /// Send a question to the VEFC Chatbot API
    /// </summary>
    /// <param name="question">The user's question</param>
    /// <param name="onResponse">Callback with the AI response</param>
    /// <param name="onError">Callback if an error occurs</param>
    public void AskQuestion(string question, System.Action<string> onResponse, System.Action<string> onError = null)
    {
        StartCoroutine(SendChatRequest(question, onResponse, onError));
    }

    private IEnumerator SendChatRequest(string question, System.Action<string> onResponse, System.Action<string> onError)
    {
        // Build the request payload
        ChatRequest request = new ChatRequest
        {
            messages = new Message[]
            {
                new Message { role = "user", content = question }
            },
            stream = false
        };

        string jsonBody = JsonUtility.ToJson(request);
        Debug.Log($"[VEFCChatbot] Sending request: {jsonBody}");

        using (UnityWebRequest www = new UnityWebRequest(apiUrl, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            www.timeout = 60; // 60 second timeout

            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                Debug.Log($"[VEFCChatbot] Response: {www.downloadHandler.text}");

                ChatResponse response = JsonUtility.FromJson<ChatResponse>(www.downloadHandler.text);

                onResponse?.Invoke(response.content);
                OnResponseReceived?.Invoke(response.content);
            }
            else
            {
                string errorMsg = $"API Error: {www.error}";
                Debug.LogError($"[VEFCChatbot] {errorMsg}");

                onError?.Invoke(errorMsg);
                OnError?.Invoke(errorMsg);
            }
        }
    }
}
```

---

### Example VR UI Controller

Create a script to handle the VR user interface:

```csharp
using UnityEngine;
using TMPro;

public class VRChatbotUI : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private VEFCChatbot chatbot;
    [SerializeField] private TMP_InputField inputField;
    [SerializeField] private TextMeshProUGUI responseText;
    [SerializeField] private GameObject loadingIndicator;

    [Header("Settings")]
    [SerializeField] private string placeholderText = "Ask about vocational rehabilitation...";

    private void Start()
    {
        if (inputField != null)
        {
            inputField.placeholder.GetComponent<TextMeshProUGUI>().text = placeholderText;
        }

        if (loadingIndicator != null)
        {
            loadingIndicator.SetActive(false);
        }
    }

    /// <summary>
    /// Call this from your VR button click event
    /// </summary>
    public void OnSubmitQuestion()
    {
        if (inputField == null || string.IsNullOrWhiteSpace(inputField.text))
        {
            return;
        }

        string question = inputField.text;

        // Show loading state
        if (responseText != null) responseText.text = "Thinking...";
        if (loadingIndicator != null) loadingIndicator.SetActive(true);

        // Send to chatbot
        chatbot.AskQuestion(
            question,
            onResponse: (response) =>
            {
                if (responseText != null) responseText.text = response;
                if (loadingIndicator != null) loadingIndicator.SetActive(false);
            },
            onError: (error) =>
            {
                if (responseText != null) responseText.text = "Sorry, something went wrong. Please try again.";
                if (loadingIndicator != null) loadingIndicator.SetActive(false);
            }
        );

        // Clear input
        inputField.text = "";
    }
}
```

---

## Example Questions to Test

Use these questions to verify the integration works:

| Question | Expected Topic |
|----------|----------------|
| "Tell me about Michael's case" | Returns case study details |
| "What is the DOT code for Human Resource Advisor?" | Returns DOT 166.267-046 |
| "What is the SVP level for HR Specialist?" | Returns SVP 7 (2-4 years) |
| "What are the physical demands for this job?" | Returns Light strength level |
| "What training is required?" | Returns education requirements |

---

## Unity Setup Instructions

### 1. Create the Scripts
- Create `VEFCChatbot.cs` with the code above
- Create `VRChatbotUI.cs` for UI handling

### 2. Set Up the Scene
1. Create an empty GameObject called "ChatbotManager"
2. Attach `VEFCChatbot` script to it
3. Create your VR UI panel with:
   - TextMeshPro Input Field
   - TextMeshPro Text for responses
   - Submit Button
4. Attach `VRChatbotUI` to the UI panel
5. Connect the references in the Inspector

### 3. VR UI Recommendations
- Position the chat panel in the top-right of the user's view
- Use world-space canvas for VR
- Make the panel follow the user's head or pin to a location
- Use XR Interaction Toolkit for button interactions

---

## Using with Meta Quest / XR Interaction Toolkit

```csharp
using UnityEngine.XR.Interaction.Toolkit;

public class VRChatbotButton : MonoBehaviour
{
    [SerializeField] private VRChatbotUI chatbotUI;
    private XRSimpleInteractable interactable;

    private void Start()
    {
        interactable = GetComponent<XRSimpleInteractable>();
        interactable.selectEntered.AddListener(OnButtonPressed);
    }

    private void OnButtonPressed(SelectEnterEventArgs args)
    {
        chatbotUI.OnSubmitQuestion();
    }
}
```

---

## Recommended Unity Packages

| Package | Purpose | Install |
|---------|---------|---------|
| TextMeshPro | UI Text rendering | Built-in |
| XR Interaction Toolkit | VR interactions | Package Manager |
| Meta XR SDK | Quest support | [Meta Developer](https://developer.oculus.com) |
| Newtonsoft JSON | Better JSON parsing (optional) | Package Manager |

---

## Error Handling

The API may return errors in these cases:

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 400 | Bad request format | Check JSON structure |
| 500 | Server error | Retry after a moment |
| Timeout | Request took too long | Increase timeout, retry |

---

## Rate Limiting

For the demo deployment:
- No strict rate limits
- Recommended: Max 1 request per second per user
- For production: Contact for dedicated deployment

---

## Support

- **GitHub Repository**: https://github.com/therealmazin/vefcchatbot
- **API Base URL**: {YOUR_API_URL}

---

## Quick Test with cURL

Test the API from command line before Unity integration:

```bash
curl -X POST {YOUR_API_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about Michael"}],"stream":false}'
```
