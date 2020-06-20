import Room from './models/room';

import io, { Socket } from 'socket.io';
import * as dotenv from 'dotenv';
import Member from './models/member';

const Rooms = new Map<string, Room>();
const Members = new Map<string, Member>();

dotenv.config();
const server = io(process.env['PORT'] || 3000, { transports: ['websocket'] });

server.on('connection', socket => {
    socket.on('nickname', (name: string) => {
        Members.set(socket.id, new Member(name.trim() || 'Unknown', socket));
    });

    socket.on('create', () => {
        if (Members.has(socket.id)) {
            const member = Members.get(socket.id) as Member;

            if (!member.room) {
                const room = new Room(member);

                Rooms.set(room.id, room);
                socket.join(room.id).emit('join-room', room.id);
            } else {
                socket.emit('exception', 'You are already connected to a room!');
            }
        }
    });

    socket.on('join', (code: string) => {
        if (Members.has(socket.id)) {
            const member = Members.get(socket.id) as Member;

            if (!Rooms.has(code)) {
                return socket.emit('exception', 'This room does not exist!');
            }

            const room = Rooms.get(code) as Room;
            if (!member.room) {
                if (room.connected.size < 4) {
                    room.connected.set(socket.id, member);
                    server.to(room.id).emit('incomer-join', { id: member.id, name: member.name });
                    socket.join(room.id).emit('join-room', room.id);
                } else
                    socket.emit('exception', 'This room is full!');
            } else {
                socket.emit('exception', 'You are already connected to a room!');
            }
        }
    });

    socket.on('message', (content: string) => {
        if (Members.has(socket.id)) {
            const member = Members.get(socket.id) as Member;

            if (member.room && content.trim()) {
                server.to(member.room)
                    .emit('message', { member: { id: member.id, name: member.name }, content });
            }
        }
    });

    socket.on('disconnecting', () => {
        if (Members.has(socket.id)) {
            const member = Members.get(socket.id) as Member;
            Members.delete(socket.id);

            if (member.room) {
                const room = Rooms.get(member.room) as Room;
                room.connected.delete(member.id);

                if (room.owner === member) {
                    Rooms.delete(room.id);
                    server.to(room.id).emit('exception', 'The room was closed by the owner!');

                    room.connected.forEach((v, k) => {
                        server.sockets.connected[k].leave(room.id);
                    });
                } else
                    server.to(room.id).emit('incomer-left', { id: member.id, name: member.name });
            }
        }
    });

});