import h from './helpers.js';
console.log("rtc js");
window.addEventListener('load', () => {
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if (!room) {
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
    } else if (!username) {
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
    } else {
        let commElem = document.getElementsByClassName('room-comm');
        for (let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
        }

        var pc = [];
        let socket = io('/stream');
        var socketId = '';
        var myStream = '';
        var recordedStream = [];
        var mediaRecorder = '';

        // Get user audio only by default
        getAndSetUserStream();

        socket.on('connect', () => {
            socketId = socket.io.engine.id;

            socket.emit('subscribe', { room: room, socketId: socketId });

            socket.on('new user', (data) => {
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                pc.push(data.socketId);
                init(true, data.socketId);
            });

            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });

            socket.on('ice candidates', async (data) => {
                if (data.candidate) {
                    await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });

            socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));

                    h.getUserAudio().then(async (stream) => {
                        myStream = stream;
                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();
                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
                    }).catch((e) => console.error(e));
                } else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });

            socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            });
        });

        function getAndSetUserStream() {
            h.getUserAudio().then((stream) => {
                myStream = stream;
                h.setLocalStream(stream);
            }).catch((e) => console.error(`Audio stream error: ${e}`));
        }

        function sendMsg(msg) {
            let data = { room: room, msg: msg, sender: username };
            socket.emit('chat', data);
            h.addChat(data, 'local');
        }

        function init(createOffer, partnerName) {
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());

            if (myStream) {
                myStream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, myStream);
                });
            }

            if (createOffer) {
                pc[partnerName].onnegotiationneeded = async () => {
                    let offer = await pc[partnerName].createOffer();
                    await pc[partnerName].setLocalDescription(offer);
                    socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
                };
            }

            pc[partnerName].onicecandidate = ({ candidate }) => {
                socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
            };

            pc[partnerName].ontrack = (e) => {
                let audioStream = e.streams[0];
                if (!document.getElementById(`${partnerName}-audio`)) {
                    let newAudio = document.createElement('audio');
                    newAudio.id = `${partnerName}-audio`;
                    newAudio.srcObject = audioStream;
                    newAudio.autoplay = true;
                    document.getElementById('audios').appendChild(newAudio);
                }
            };

            pc[partnerName].onconnectionstatechange = () => {
                if (pc[partnerName].iceConnectionState === 'disconnected' || pc[partnerName].iceConnectionState === 'failed') {
                    h.closeAudio(partnerName);
                }
            };
        }
    }
});
