/**
 * M87 Air Command — Type Definitions
 * Phase 1: Hand Tracking Core
 */

/** A single MediaPipe hand landmark in normalized coordinates. */
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

/** Messages sent FROM React TO the hand worker. */
export type WorkerIncomingMessageType = "INIT" | "FRAME";

export interface WorkerInitMessage {
  type: "INIT";
}

export interface WorkerFrameMessage {
  type: "FRAME";
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export type WorkerIncomingMessage = WorkerInitMessage | WorkerFrameMessage;

/** Messages sent FROM the hand worker TO React. */
export type WorkerOutgoingMessageType = "HAND_DETECTED" | "NO_HAND" | "WORKER_READY";

export interface WorkerHandDetectedMessage {
  type: "HAND_DETECTED";
  /** Array of 21 landmarks for the detected hand. */
  landmarks: HandLandmark[];
}

export interface WorkerNoHandMessage {
  type: "NO_HAND";
}

export interface WorkerReadyMessage {
  type: "WORKER_READY";
}

export type WorkerOutgoingMessage =
  | WorkerHandDetectedMessage
  | WorkerNoHandMessage
  | WorkerReadyMessage;
