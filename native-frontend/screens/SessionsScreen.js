import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, RefreshControl, Pressable } from "react-native";
import { FlatList } from 'react-native-gesture-handler';
import moment from 'moment';

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
            console.log("Getting sessions")
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
            <View className="bg-white h-full p-5 rounded-md ml-10 mr-10">
                <Pressable onPress={()=>handlePress(item.session_id)} className="flex-row flex-1 w-full">
                    <Text className="flex-[4] justify-start align-middle text-[24px] pt-[10]">{item.session_name}</Text>
                    <Text className="flex-1 justify-end align-middle text-center">{moment(item.created_at).format('MMMM Do YYYY')}</Text>
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
        <View className="flex flex-1 bg-[#00b5b8] pt-20 flex-col">
            <View className="flex-1">
                <Text className="w-full justify-center text-center text-[26px]" >
                    Explore Your Study Sessions
                </Text>
            </View>
            <View className="flex-[4]">
                <FlatList
                    data={sessions}
                    renderItem={({item}) => renderItem(item)}
                    keyExtractor={(item, index) => `item-${index}`}
                    refreshControl={<RefreshControl refreshing={fetching} onRefresh={onRefresh} />}
                />
            </View>

        </View>
    )
}

export default SessionsScreen;