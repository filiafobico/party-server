import seedrandom from 'seedrandom';
import Member from './member';

export default class Room {

    /**
     * The unique id of this room
     */
    public readonly id: string;

    /**
     * The owner's id of this room
     */
    public readonly owner: Member;

    /**
     * A list of connected sockets to this room
     */
    public readonly connected: Map<string, Member> = new Map();

    constructor(owner: Member) {
        this.owner = owner;
        this.id = String(Math.abs(seedrandom(this.owner.id).int32()));
        this.connected.set(this.owner.id, owner);
    }

}