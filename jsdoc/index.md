# OpenSpace-remote-control

### Description
This project is based on  [OpensPace Socket api](https://gist.github.com/emiax/b7a8f9058eb871bc033079e00c13e3b1) to acheive remote control of [OpenSpace](https://www.openspaceproject.com/) in multi-platform.

### Structure
**Backend** - deals with communication with software and mobile devices

-  **index.js** - Intialize the server and libraries
-  **config.js** - Configuration
-  **lib/ip** - Find the local remote ip address of host computer
- **lib/openspace.js** - Method to remote control the software, such as achieve the zooming and rotating, view perspective.
- **lib/socket_server.js** - Inner Communication between different devices  


**Frontend** - user interface and send user inputs to server
- **client.js** - Handling user activities, such as login in/out, sending message to server
- **config.js** - Configuration
- **joystick.js** - Joystick
- **main.js** - Control panel, such as planet slider
- **speech.js** - Detecting user voice then calibrated to desired term

### wiki
For more information, please view the [wiki page](https://github.com/ccnyplanetarium/OpenSpace-remote-control/wiki)
