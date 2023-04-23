import 'react-native-gesture-handler';
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";


WebBrowser.maybeCompleteAuthSession();


function HomeScreen({route,navigation}) {
  const [token, setToken] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [email, setEmail] = useState(null);
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

  const getUserInfo = async () => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = await response.json();
      setEmail(user.email);
      setUserInfo(user);
      navigation.navigate("SessionsScreen", {email: user.email, baseUrl})
    } catch (error) {
      // Add your own error handler here
    }
  };

  return (
    <View style={styles.container}>
      {userInfo === null ? (
        <Button
          className="bg"
          title="Sign in with Google"
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
        />
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
