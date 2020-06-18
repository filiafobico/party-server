import Room from './models/room';

import io from 'socket.io';
import * as dotenv from 'dotenv';

const Rooms = new Map<string, Room>();

dotenv.config();
const server = io(process.env['PORT'] || 3000, { transports: ['websocket'] });

server.on('connection', socket => {
    socket.on('create', () => {
        const rooms = Object.keys(socket.rooms);
        if (rooms.length == 1) {
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
            const rooms = Object.keys(socket.rooms);
            if (rooms.length == 1) {
                if (room.connected.length < 4) {
                    socket.join(room.id);
                    room.connected.push(socket.id);
                } else
                    socket.emit('exception', 'This room is full!');
            } else
                socket.emit('exception', 'You are already connected to a room!');
        }
    });

    socket.on('message', (message: string) => {
        const rooms = Object.keys(socket.rooms);
        if (rooms.length == 2 && message.trim()) {
            server.to(rooms[1]).emit('message', {
                content: message,
                author: {
                    id: socket.id,
                    name: socket.id
                }
            });
        } else if (rooms.length == 1)
            socket.emit('exception', 'You are not connected to a room!');
    });

    socket.on('disconnecting', () => {
        const rooms = Object.keys(socket.rooms);
        if (rooms.length == 2 && Rooms.has(rooms[1])) {
            const room = Rooms.get(rooms[1]) as Room;
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