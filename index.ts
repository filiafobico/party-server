import Room from './models/room';

import io, { Socket } from 'socket.io';
import * as dotenv from 'dotenv';
import Member from './models/member';

const Rooms = new Map<string, Room>();

dotenv.config();
const server = io(process.env['PORT'] || 3000, { transports: ['websocket'] });

server.on('connection', socket => {
    socket.on('create', () => {
        const rooms = getRooms(socket);

        if (!rooms.length) {
            const room = new Room({ id: socket.id, name: socket.id });

            Rooms.set(room.id, room);
            server.to(room.id).emit('incomer-join',);
            socket.join(room.id).emit('join-room', room.id);
        } else
            socket.emit('exception', 'You are already connected to a room!');
    });

    socket.on('join', (code: string) => {
        if (!Rooms.has(code)) {
            socket.emit('exception', 'This room does not exist!');
        } else {
            const room = Rooms.get(code) as Room;
            const rooms = getRooms(socket);

            if (!rooms.length) {
                if (room.connected.size < 4) {
                    const member = { id: socket.id, name: socket.id };

                    room.connected.set(socket.id, member);
                    server.to(room.id).emit('incomer-join', member);
                    socket.join(room.id).emit('join-room', room.id);
                } else
                    socket.emit('exception', 'This room is full!');
            } else
                socket.emit('exception', 'You are already connected to a room!');
        }
    });

    socket.on('message', (message: string) => {
        const rooms = getRooms(socket);

        if (rooms.length == 1 && message.trim()) {
            server.to(rooms[0]).emit('message', {
                content: message,
                author: Rooms.get(rooms[0])?.connected.get(socket.id)
            });
        } else if (!rooms.length)
            socket.emit('exception', 'You are not connected to a room!');
    });

    socket.on('disconnecting', () => {
        const rooms = getRooms(socket);

        if (rooms.length == 1 && Rooms.has(rooms[0])) {
            const room = Rooms.get(rooms[0]) as Room;
            const member = room.connected.get(socket.id) as Member;

            room.connected.delete(socket.id);
            if (room.owner === member) {
                server.to(room.id).emit('leave-room');
                server.to(room.id).emit('exception', 'The room was closed by the owner!');

                room.connected.forEach((v, k) => {
                    server.sockets.connected[k].leave(room.id);
                });
                Rooms.delete(room.id);
            } else
                server.to(room.id).emit('incomer-left', member);
        }
    });
});

function getRooms(socket: Socket) {
    return Object.keys(socket.rooms).filter(e => e !== socket.id);
}