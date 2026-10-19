/** Open the audio selector from anywhere (e.g. the player bar). Lives apart
 *  from AudioSelectorDialog so the always-mounted player bar can fire it
 *  without pulling the dialog into the entry chunk. */
export const OPEN_AUDIO_SELECTOR_EVENT = "sf:open-audio-selector";
