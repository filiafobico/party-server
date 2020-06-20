import { Socket } from "socket.io";

export default class Member {

    /**
     * The member's id
     */
    public readonly id: string;

    /**
     * The member's name
     */
    public readonly name: string;

    /**
     * The member's socket
     */
    private readonly socket: Socket;

    constructor(name: string, socket: Socket) {
        this.name = name;
        this.socket = socket;
        this.id = this.socket.id;
    }

    public get room() {
        return Object.keys(this.socket.rooms)
            .filter(e => e !== this.socket.id)[0];
    }

}