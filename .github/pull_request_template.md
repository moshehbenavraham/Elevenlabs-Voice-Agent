## 📋 Pull Request Description

**Summary**
Provide a clear and concise description of what this PR does.

**Related Issue(s)**
- Closes #[issue number]
- Fixes #[issue number]
- Addresses #[issue number]

**Motivation and Context**
Why is this change required? What problem does it solve?

## 🔄 Type of Change

Please check the type of change your PR introduces:

- [ ] 🐛 **Bug fix** (non-breaking change which fixes an issue)
- [ ] ✨ **New feature** (non-breaking change which adds functionality)
- [ ] 💥 **Breaking change** (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 **Documentation** (updates to documentation)
- [ ] 🎨 **Style/UI** (formatting, missing semi colons, etc; no code change)
- [ ] ♻️ **Code refactor** (refactoring production code, no functional changes)
- [ ] ⚡ **Performance** (code change that improves performance)
- [ ] 🧪 **Test** (adding missing tests, refactoring tests; no production code change)
- [ ] 🔧 **Chore** (updating build tasks, package manager configs, etc; no production code change)

## 🎤 Voice AI Specific Changes

**Voice Features Affected:**
- [ ] ElevenLabs API integration
- [ ] Microphone access/permissions
- [ ] Audio recording functionality
- [ ] Audio playback features
- [ ] Voice recognition/processing
- [ ] Audio visualization components
- [ ] Voice animation system
- [ ] Real-time audio processing
- [ ] Voice accessibility features
- [ ] Mobile voice functionality

**Voice Integration Testing:**
- [ ] ElevenLabs API integration tested
- [ ] Microphone permissions work correctly
- [ ] Audio recording/playback functional
- [ ] Voice features work across browsers
- [ ] Mobile voice functionality verified
- [ ] Voice accessibility features tested

## 🧪 Testing Checklist

### General Testing
- [ ] **Unit tests** pass (`npm run test`)
- [ ] **Integration tests** pass
- [ ] **Build** completes without errors (`npm run build`)
- [ ] **Linting** passes (`npm run lint`)
- [ ] **Type checking** passes (`npm run type-check`)
- [ ] **Manual testing** completed

### Voice-Specific Testing
- [ ] **Voice functionality** tested manually
- [ ] **Microphone permissions** work correctly
- [ ] **Audio recording** starts/stops properly
- [ ] **Audio playback** works without issues
- [ ] **Voice animations** respond correctly
- [ ] **Audio visualization** displays properly
- [ ] **Error handling** works for voice failures

### Browser Compatibility
- [ ] **Chrome** (latest version)
- [ ] **Firefox** (latest version)
- [ ] **Safari** (latest version)
- [ ] **Edge** (latest version)
- [ ] **Mobile browsers** (iOS Safari, Android Chrome)

### Mobile Testing
- [ ] **Mobile compatibility** verified
- [ ] **Touch interactions** work correctly
- [ ] **Responsive design** functions properly
- [ ] **Mobile voice features** functional
- [ ] **Performance** acceptable on mobile devices

### Accessibility Testing
- [ ] **Keyboard navigation** works
- [ ] **Screen reader** compatibility verified
- [ ] **Focus management** proper
- [ ] **ARIA labels** implemented correctly
- [ ] **Color contrast** meets standards
- [ ] **Voice alternatives** provided for non-voice users

## 🔧 Technical Details

**Implementation Notes:**
Describe any technical implementation details, patterns used, or architectural decisions.

**Dependencies:**
List any new dependencies added or updated.

**Configuration Changes:**
Describe any configuration file changes or environment variable requirements.

**Database/API Changes:**
List any database schema changes or API modifications.

## 📱 Mobile Considerations

**Mobile Changes:**
- [ ] Touch interaction improvements
- [ ] Responsive design updates
- [ ] Mobile-specific features
- [ ] Performance optimizations for mobile
- [ ] Battery usage considerations

**Mobile Testing Notes:**
Describe any mobile-specific testing performed.

## ♿ Accessibility Impact

**Accessibility Improvements:**
- [ ] Keyboard navigation enhanced
- [ ] Screen reader support improved
- [ ] ARIA labels added/updated
- [ ] Color contrast improved
- [ ] Voice alternatives provided
- [ ] Focus management enhanced

**Accessibility Testing:**
Describe accessibility testing performed and tools used.

## 🚀 Performance Impact

**Performance Considerations:**
- [ ] Bundle size impact assessed
- [ ] Runtime performance tested
- [ ] Memory usage evaluated
- [ ] Audio processing performance tested
- [ ] Network usage optimized

**Performance Metrics:**
- Bundle size change: [+/- X KB]
- Runtime performance: [No impact/Improved/Degraded]
- Memory usage: [No impact/Improved/Degraded]
- Audio processing: [No impact/Improved/Degraded]

## 📸 Screenshots/Recordings

### Before
[Include screenshots or recordings showing the current state]

### After
[Include screenshots or recordings showing the changes]

### Mobile Views
[Include mobile screenshots if relevant]

### Voice Features Demo
[Include recordings or descriptions of voice feature changes]

## 💥 Breaking Changes

**Breaking Changes:**
- [ ] No breaking changes
- [ ] Breaking changes (describe below)

**Breaking Change Details:**
If there are breaking changes, describe:
- What is breaking
- Why it was necessary
- How to migrate existing code
- Impact on users

**Migration Guide:**
Provide step-by-step instructions for migrating from the old behavior to the new behavior.

## 📚 Documentation Updates

**Documentation Changes:**
- [ ] README.md updated
- [ ] API documentation updated
- [ ] Component documentation updated
- [ ] Setup/installation guides updated
- [ ] Troubleshooting guides updated
- [ ] CHANGELOG.md updated

**Documentation Location:**
List the specific documentation files that were updated.

## 🔗 Related Resources

**Useful Links:**
- Link to design mockups/wireframes
- Link to technical specifications
- Link to related issues or discussions
- Link to external documentation or resources

**References:**
- ElevenLabs documentation references
- Web Audio API documentation
- Accessibility guidelines followed
- Performance optimization resources

## 🎯 Checklist for Reviewers

**Review Focus Areas:**
- [ ] Code quality and style
- [ ] Voice integration correctness
- [ ] Mobile compatibility
- [ ] Accessibility compliance
- [ ] Performance impact
- [ ] Security considerations
- [ ] Documentation completeness

**Specific Review Requests:**
- Please pay special attention to [specific area]
- Test with [specific configuration/device]
- Verify [specific functionality]

## 🚦 Deployment Considerations

**Deployment Notes:**
- [ ] No special deployment requirements
- [ ] Requires environment variable updates
- [ ] Requires database migrations
- [ ] Requires configuration changes
- [ ] Requires third-party service updates

**Rollback Plan:**
Describe how to rollback this change if issues arise.

## 🧑‍💻 Additional Notes

**Development Notes:**
Add any additional context, concerns, or notes for reviewers.

**Future Improvements:**
List any follow-up tasks or improvements that could be made.

**Known Limitations:**
Describe any known limitations or issues that will be addressed in future PRs.

---

## 📋 Post-Merge Checklist

**After Merge:**
- [ ] Verify deployment was successful
- [ ] Monitor for any issues or regressions
- [ ] Update project documentation if needed
- [ ] Communicate changes to stakeholders
- [ ] Create follow-up issues for future improvements

**Monitoring:**
- [ ] Error rates stable
- [ ] Performance metrics normal
- [ ] Voice features functioning correctly
- [ ] Mobile functionality verified
- [ ] User feedback monitored

---

**Thank you for your contribution! 🎉**

By submitting this pull request, I confirm that:
- [ ] I have read and agree to the project's Code of Conduct
- [ ] I have followed the Contributing Guidelines
- [ ] I have tested my changes thoroughly
- [ ] I have updated documentation as needed
- [ ] I am willing to address feedback and make necessary changes