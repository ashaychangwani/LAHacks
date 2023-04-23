import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {NavigationContainer, CommonActions} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from "./screens/HomeScreen";
import SessionsScreen from './screens/SessionsScreen';
import SessionScreen from './screens/SessionScreen';
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="C.R.A.P"
        component={HomeScreen}
        options={{
          headerShown: false,
          }}
      />
      <Stack.Screen
        name="SessionsScreen"
        component={SessionsScreen}
        options={{
          headerShown: false,
          }}
      />
      <Stack.Screen
        name="SessionScreen"
        component={SessionScreen}
        options={{
          headerShown: false,
          }}
      />
    </Stack.Navigator>
  </NavigationContainer>
  );
}

export default App;