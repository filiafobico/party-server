import Room from './models/room';

import io, { Socket } from 'socket.io';
import * as dotenv from 'dotenv';

const Rooms = new Map<string, Room>();

dotenv.config();
const server = io(process.env['PORT'] || 3000, { transports: ['websocket'] });

server.on('connection', socket => {
    socket.on('create', () => {
        const rooms = getRooms(socket);
        if (!rooms.length) {
            const room = new Room(socket.id);
            socket.join(room.id).emit('room', room.id);
            Rooms.set(room.id, room);
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
                if (room.connected.length < 4) {
                    room.connected.push(socket.id);
                    socket.join(room.id).emit('room', room.id);
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
                author: {
                    id: socket.id,
                    name: socket.id
                }
            });
        } else if (!rooms.length)
            socket.emit('exception', 'You are not connected to a room!');
    });

    socket.on('disconnecting', () => {
        const rooms = getRooms(socket);
        if (rooms.length == 1 && Rooms.has(rooms[0])) {
            const room = Rooms.get(rooms[0]) as Room;
            room.connected.splice(room.connected.indexOf(socket.id), 1);

            if (room.owner === socket.id) {
                server.to(room.id).emit('exception', 'The room was closed by the owner!');
                room.connected.map(e => server.sockets.connected[e])
                    .forEach(client => client.leave(room.id));
                Rooms.delete(room.id);
            }
        }
    });
});

function getRooms(socket: Socket) {
    return Object.keys(socket.rooms).filter(e => e !== socket.id);
}