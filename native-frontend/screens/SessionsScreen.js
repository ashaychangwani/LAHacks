import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, RefreshControl, Pressable } from "react-native";
import { FlatList } from 'react-native-gesture-handler';

function SessionsScreen({route, navigation}) {
    const { email, baseUrl } = route.params;
    const [sessions, setSessions] = useState([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
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
        } finally {
            setFetching(false);
        }
    }
    const handlePress = (session_id) => {
        console.log("Navigating to session",session_id)
        navigation.navigate('SessionScreen', {email: email, baseUrl: baseUrl, session_id: session_id})
    }

    const renderItem = (item) => {
        return (
            <View className="w-full bg-gray-500 h-5 flex-row">
                <Pressable onPress={()=>handlePress(item.session_id)}>
                    <Text>{item.session_id}</Text>
                    <Text>{item.session_name}</Text>
                </Pressable>
            </View>
        )
    }

    const onRefresh = () => {
        console.log("Refreshing");
        setFetching(true)
        getSessions();
    }

    return (
        <View className="flex flex-1">
            <FlatList
                data={sessions}
                renderItem={({item}) => renderItem(item)}
                keyExtractor={item => item.session_id}
                refreshControl={<RefreshControl refreshing={fetching} onRefresh={onRefresh} />}
            />

        </View>
    )
}

export default SessionsScreen;