// ./App.js
import 'react-native-gesture-handler';
import { SocketContext, socket } from './contexts/socket.context';
import HomeScreen from './screens/home.screen';
import OnlineGameScreen from './screens/online-game.screen';
import VsBotGameScreen from './screens/vs-bot-game.screen';

import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


const Stack = createStackNavigator();
LogBox.ignoreAllLogs(true);

function App() {
  return (
    <SocketContext.Provider value={socket}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="HomeScreen">
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="OnlineGameScreen" component={OnlineGameScreen} />
          <Stack.Screen name="VsBotGameScreen" component={VsBotGameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SocketContext.Provider>
  );
}

export default App;