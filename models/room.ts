import crypto from 'crypto';

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
        this.id = crypto.createHmac('md5', key).update(String(Date.now())).digest('base64');
        this.owner = key;
        this.connected.push(this.owner);
    }

}