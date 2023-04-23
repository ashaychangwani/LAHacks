import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { FlatList } from 'react-native-gesture-handler';

function SessionsScreen({route, navigation}) {
    const { email, baseUrl } = route.params;
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        console.log(email)
        if(email != null)
            getSessions();
    }, [email]);

    const getSessions = async () => {
        try {
            const response = await fetch(
                `${baseUrl}get-sessions?user_id=${email}`,
                {
                    headers: { user_id: email },
                    method: 'GET',
                }
            );
            const sessions = await response.json();
            console.log(sessions)
            setSessions(sessions);
        } catch (error) {
            // Add your own error handler here
        }
    }

    const renderItem = (item) => {
        console.log("Rendering item")
        return (
            <View>
                <Text>{item.session_id}</Text>
                <Text>{item.session_name}</Text>
            </View>
        )
    }
    return (
        <View className="flex flex-1 bg-[#F00]">
            <FlatList
                data={sessions}
                renderItem={({item}) => renderItem(item)}
                keyExtractor={item => item.session_id}
            />

        </View>
    )
}

export default SessionsScreen;