import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, RefreshControl, Pressable } from "react-native";
import { FlatList } from 'react-native-gesture-handler';

function SessionScreen({route, navigation}) {
    const { email, baseUrl, session_id } = route.params;
    const [sessionData, setSessionData] = useState(null);
    const [fetching, setFetching] = useState(false);

    // Effect to run only once on load
    useEffect(() => {
        if(session_id != null){
            getSessionData();
        }
    }, []);

    const getSessionData = async () => {
        try {
            const response = await fetch(
                `${baseUrl}get-session?user_id=${email}&session_id=${session_id}`,
                {
                    headers: {},
                    method: 'GET',
                }
            );
            const sessionObj = await response.json();
            setSessionData(sessionObj);
            console.log(sessionObj);
        } catch (error) {
            // Add your own error handler here
        } finally {
            setFetching(false);
        }
    }

    const renderItem = (item) => {
        console.log("Rendering item", item)
        if(item.type == 'heading')
            return (
                <View>
                    <Text className="font-bold text-xl">{item.content}</Text>
                </View>
            )
        else if(item.type == 'paragraph')
            return (
                <View>
                    <Text>{item.content}</Text>
                </View>
            )
        else if(item.type == 'list')
            return (
                <View>
                    {item.content.map((listItem) => (
                        <Text>* {listItem}</Text>
                    ))}
                </View>
            )

        return (
            <View className="w-full bg-gray-500 h-5">
                <Text>{item.type}</Text>
                <Text>{item.content}</Text>
            </View>
        )
    }

    const onRefresh = () => {
        console.log("Refreshing");
        setFetching(true)
        getSessionData();
    }

    const generateQuiz = async () => {
        try {
            const session = {
                session_id: session_id,
                user_id: email
            };
            const num_questions = 20;
            const response = await fetch(`${baseUrl}generate-questions`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                session: session,
                num_questions: num_questions
                })
            });
        }
        catch (error){}
    }

    const navigateToQuiz = () => {
        // navigation.navigate('Quiz',
    }

    return (
        <View className="flex flex-1 ">
            { sessionData != null ? (
                <View>
                    <View>
                        <Text>{sessionData.session_name}</Text>
                        <FlatList
                            data={sessionData.blobs}
                            renderItem={({item}) => renderItem(item)}
                            // Use index for key
                            keyExtractor={(item, index) => index.toString()}
                            refreshControl={
                                <RefreshControl refreshing={fetching} onRefresh={onRefresh} />
                            }
                            />
                    </View>
                { 
                    Object.keys(sessionData.quiz).length == 0 ? 
                        (
                            <Pressable onPress={()=>generateQuiz}>
                                <Text>Create Quiz</Text>
                            </Pressable>
                        )
                        :
                        (
                            <Pressable onPress={()=>navigateToQuiz}>
                                <Text>Take Quiz ({sessionData.quiz.num_questions} questions)</Text>
                            </Pressable>
                        )
                }
                </View>
                ) : (
                    <View></View>
                )}

        </View>
    )
}

export default SessionScreen;