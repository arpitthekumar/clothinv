/**
 * Sound utilities for POS automation feedback
 */

export function playAutomationSound(): void {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
    oscillator.type = 'sine';

    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); // Quick decay

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2); // 200ms duration

  } catch (error) {
    // Fallback: try to play a system beep or just log
    console.warn('Could not play automation sound:', error);
    // Some browsers might support this
    if ('vibrate' in navigator) {
      navigator.vibrate(100); // Haptic feedback as fallback
    }
  }
}