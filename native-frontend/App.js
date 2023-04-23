import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {NavigationContainer, CommonActions} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from "./screens/HomeScreen";
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
          }}
      />
    </Stack.Navigator>
  </NavigationContainer>
  );
}

export default App;