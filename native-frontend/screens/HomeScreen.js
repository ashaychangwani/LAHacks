import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";


WebBrowser.maybeCompleteAuthSession();


function HomeScreen({ route, navigation }) {
  const [ token, setToken ] = useState("");
  const [ userInfo, setUserInfo ] = useState(null);
  const [ email, setEmail ] = useState(null);

  const baseUrl = 'http://128.122.49.69:20440/'
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "48155888637-grafopqvvm80gp3qo6vfptu40bti1a33.apps.googleusercontent.com",
    iosClientId: "48155888637-bdcknhn8ob4i7t6a9qa5sa6cc9l1iomp.apps.googleusercontent.com",
    expoClientId: "48155888637-r0bni30tp9mmmnvacrg7o1bb3pekhave.apps.googleusercontent.com"
  });

  useEffect(() => {
    if (response?.type === "success") {
      setToken(response.authentication.accessToken);
      getUserInfo();
    }
  }, [response, token]);

  const navigateToSessions = () => {
    console.log("Navigating to Sessions")
    navigation.navigate("SessionsScreen", {email: email, baseUrl})
  }

  useEffect(() => {
    console.log("INside useEffect")
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Found focus", email)
      if(email != null)
        navigateToSessions()
    });
    return unsubscribe;
  }, [navigation])

  useEffect(() => {
    if(email != null)
      navigateToSessions();
  }, [email])

  const getUserInfo = async () => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = await response.json();
      if(user.email != null)
        setEmail(user.email);
      setUserInfo(user);
    } catch (error) {
      // Add your own error handler here
    }
  };

  return (
    <View className="flex-1 align-middle items-center justify-center flex-col  p-7 pt-20 bg-[#00b5b8]">
    <Text className="font-bold text-[30px] flex-1 justify-center items-center align-middle text-center text-middle pt-20">Welcome to CRAP</Text>
    <Text className="text-[18px] flex-1 justify-center items-center text-center">Creative and Remarkable AI for Productivity</Text>
      {userInfo === null ? (
        <View className="flex-[2]">
            <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.1 : 1,
            })}
            className="bg-[#fff] text-white text-[20px] font-bold py-5 px-6 rounded-full border-[rgba(31,59,65,1)] border-4"
            disabled={!request}
            onPress={() => {
              promptAsync();
            }}
          ><Text className="text-[18px]">Sign in with Google</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.text}>{userInfo.name}</Text>
      )}
    </View>
  );
}
export default HomeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
