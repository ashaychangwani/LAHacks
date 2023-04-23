import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";

function SessionsScreen({route, navigation}) {
    const {email} = route.params;
    return (
        <View className="h-full w-full bg-[#f00] flex-1 flex">
            <Text className="text-white">Hello World2</Text>
        </View>
    )
}

export default SessionsScreen;