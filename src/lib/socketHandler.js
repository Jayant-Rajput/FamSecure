import User from "../models/User.js";
import Group from "../models/Group.js";

export const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log("socket connected ", socket.id);

        socket.on('joinGroups', async ({userId}) => {
            try{
                const user = await User.findById(userId).populate('groups'); 
                if(!user) return;
                
                user.groups.forEach( group => {
                    const groupId = group._id.toString();
                    socket.join(groupId);
                    console.log(`user ${userId} joined group ${groupId}`);
                })

                await User.findByIdAndUpdate(userId, {socketId: socket.id});

            } catch(error){
                console.log("Error Joining Groups ", error);
            }
        });


        socket.on('locationUpdate', async({ userId, lat, lon, groupId}) => {
            try{
                const timestamp = Date.now();

                await User.findByIdAndUpdate(userId, {lastLocation: { lat, lon, timestamp}});

                io.to(groupId).emit('locationBroadcast', {
                    userId,
                    lat,
                    lon,
                    timestamp,
                });

            } catch(error){
                console.log("Error in location update ", error);
            }
        });


        socket.on('disconnect', ()=>{
            console.log('User Disconnected: ', socket.id);
        });
    }); 
}