import { EventEmitter } from 'events';

class AlgoMindEventEmitter extends EventEmitter {}

const eventEmitter = new AlgoMindEventEmitter();

export default eventEmitter;
