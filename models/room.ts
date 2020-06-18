import seedrandom from 'seedrandom';

export default class Room {

    /**
     * The unique id of this room
     */
    public readonly id: string;

    /**
     * The owner's id of this room
     */
    public readonly owner: string;

    /**
     * A list of connected sockets to this room
     */
    public readonly connected: Array<string> = [];

    constructor(key: string) {
        this.id = String(Math.abs(seedrandom(key).int32()));
        this.owner = key;
        this.connected.push(this.owner);
    }

}