---
name: Voice Integration Issue
about: Report issues with ElevenLabs integration or voice features
title: '[VOICE] '
labels: voice, integration
assignees: ''
---

## 🎤 Voice Integration Issue

**Issue Summary**
A clear and concise description of the voice-related issue you're experiencing.

**Issue Category**
- [ ] ElevenLabs API integration
- [ ] Microphone access/permissions
- [ ] Audio recording issues
- [ ] Audio playback problems
- [ ] Voice recognition accuracy
- [ ] Audio visualization problems
- [ ] Voice animation issues
- [ ] Real-time processing lag
- [ ] Browser audio compatibility
- [ ] Mobile voice functionality
- [ ] Voice accessibility features

## 🔧 ElevenLabs Configuration
**Agent Configuration:**
- Agent ID: [Your agent ID or "Not configured"]
- API Key Status: [Working/Not Working/Not Set/Invalid]
- Voice Model: [e.g., eleven_monolingual_v1, eleven_multilingual_v1]
- Voice Settings: [Stability, Similarity, Style, Speaker Boost if applicable]

**Connection Status:**
- [ ] Successfully connected to ElevenLabs API
- [ ] Connection fails during initialization
- [ ] Connection drops during conversation
- [ ] Intermittent connection issues
- [ ] Authentication errors
- [ ] Rate limiting issues

**API Response Information:**
```json
// Paste any relevant API response or error here
```

## 🎵 Audio Technical Details
**Audio Hardware:**
- Microphone Type: [Built-in, USB, Bluetooth, External]
- Audio Input Device: [Device name/model]
- Audio Output Device: [Speakers, Headphones, Bluetooth]
- Sample Rate: [e.g., 44.1kHz, 48kHz, if known]
- Audio Format: [if known]

**Audio Quality Assessment:**
- [ ] Audio input is clear and strong
- [ ] Audio input is quiet or muffled
- [ ] Audio input has background noise
- [ ] Audio input cuts in and out
- [ ] Audio output is clear
- [ ] Audio output is distorted
- [ ] Audio output has delays/lag
- [ ] Audio output volume issues

**Audio Processing:**
- [ ] Real-time processing works smoothly
- [ ] Processing has noticeable delays
- [ ] Processing fails intermittently
- [ ] Processing causes browser to freeze
- [ ] Memory usage increases over time
- [ ] CPU usage is very high

## 🔐 Permissions & Security
**Microphone Permissions:**
- [ ] Permission granted successfully
- [ ] Permission denied by user
- [ ] Permission prompt not appearing
- [ ] Permission revoked during session
- [ ] Permission works in other apps/sites
- [ ] Permission fails only in this app

**Browser Security Context:**
- [ ] Using HTTPS (secure context)
- [ ] Using HTTP (may cause issues)
- [ ] Behind corporate firewall
- [ ] Using VPN connection
- [ ] Browser has strict privacy settings
- [ ] Browser extensions may be interfering

## 🌐 Browser Compatibility
**Browser Information:**
- Browser: [e.g., Chrome 91, Firefox 89, Safari 14, Edge 91]
- Version: [Specific version number]
- Operating System: [Windows 10, macOS Big Sur, Ubuntu 20.04, etc.]
- Browser Extensions: [List any relevant extensions]

**Audio API Support:**
- [ ] Web Audio API supported
- [ ] MediaRecorder API supported
- [ ] getUserMedia API supported
- [ ] AudioContext working properly
- [ ] WebRTC features available
- [ ] Speech Recognition API available

**Known Browser Issues:**
- [ ] Works in Chrome but not Firefox
- [ ] Works in desktop but not mobile
- [ ] Works in incognito/private mode
- [ ] Requires browser restart to work
- [ ] Issues with specific browser version

## 📱 Mobile-Specific Issues
**Mobile Device Information:**
- Device: [e.g., iPhone 12, Samsung Galaxy S21, iPad Pro]
- OS Version: [e.g., iOS 14.6, Android 11]
- Browser: [e.g., Safari, Chrome Mobile, Firefox Mobile]
- Screen Orientation: [Portrait, Landscape, Both]

**Mobile Audio Challenges:**
- [ ] Touch to start audio doesn't work
- [ ] Audio doesn't work after screen lock
- [ ] Battery drain during voice use
- [ ] Audio quality poor on mobile
- [ ] Microphone conflicts with other apps
- [ ] Audio delays on mobile network

**Mobile UI/UX Issues:**
- [ ] Voice controls too small for touch
- [ ] Audio visualization not visible
- [ ] Voice animations lag on mobile
- [ ] App doesn't work in mobile browser
- [ ] Requires specific mobile browser

## 🔍 Error Details
**Console Error Messages:**
```javascript
// Paste any console errors here
```

**Network Errors:**
```
// Paste any network-related errors here
```

**ElevenLabs API Errors:**
```json
// Paste any ElevenLabs API error responses here
```

## 🔄 Steps to Reproduce
**Detailed Steps:**
1. Open the application in [browser]
2. Click on [specific button/feature]
3. Allow microphone permissions when prompted
4. Speak into microphone / perform voice action
5. Observe the issue occurs

**Frequency:**
- [ ] Happens every time
- [ ] Happens sometimes (intermittent)
- [ ] Happened once
- [ ] Depends on specific conditions

**Timing:**
- [ ] Happens immediately on page load
- [ ] Happens after using voice features
- [ ] Happens after extended use
- [ ] Happens at specific times of day

## 🎯 Expected vs Actual Behavior
**Expected Behavior:**
Describe what should happen with the voice feature.

**Actual Behavior:**
Describe what actually happens instead.

**Impact Assessment:**
- [ ] Critical (voice features completely unusable)
- [ ] High (major voice functionality broken)
- [ ] Medium (some voice features affected)
- [ ] Low (minor voice issue, workaround available)

## 🔧 Troubleshooting Attempted
**What have you already tried?**
- [ ] Refreshed the page
- [ ] Checked microphone permissions
- [ ] Tried different microphone/audio device
- [ ] Tested in different browser
- [ ] Tested in incognito/private mode
- [ ] Cleared browser cache and cookies
- [ ] Disabled browser extensions
- [ ] Restarted browser
- [ ] Restarted device
- [ ] Checked ElevenLabs API key
- [ ] Tested with different voice model
- [ ] Checked network connection
- [ ] Tested on different device

**Other troubleshooting steps:**
[Describe any other troubleshooting you've done]

## 🎨 Voice UX Context
**Use Case:**
Describe how you were using the voice features when the issue occurred.

**User Journey:**
What were you trying to accomplish with the voice functionality?

**Accessibility Needs:**
- [ ] Using screen reader
- [ ] Using keyboard navigation
- [ ] Hearing impairment considerations
- [ ] Motor impairment considerations
- [ ] Voice is primary interaction method

## 📊 Performance Impact
**Performance Metrics (if available):**
- CPU usage: [percentage if known]
- Memory usage: [if increasing over time]
- Response times: [if notably slow]
- Battery impact: [on mobile devices]

**User Experience Impact:**
- [ ] App becomes unresponsive
- [ ] Voice responses are delayed
- [ ] Audio quality degrades over time
- [ ] Feature is unusable
- [ ] Feature works but with poor UX

## 🔗 Related Information
**Related Issues:**
Link to any related issues, discussions, or PRs.

**Documentation References:**
- ElevenLabs documentation consulted
- Web Audio API documentation used
- Browser compatibility resources checked

**Community Resources:**
- Stack Overflow questions researched
- Developer forums consulted
- Similar projects or examples found

---

**Additional Context:**
Add any other context about the voice integration issue here, including screenshots of error messages, audio waveforms, or UI problems.

**Willingness to Help:**
- [ ] I can provide more detailed logs
- [ ] I can test potential fixes
- [ ] I can help reproduce the issue
- [ ] I have development experience with audio/voice