import { Stack } from "expo-router";
import BookingScreen from "./screens/BookingScreen";

export default function BookingRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Prendre rendez-vous" }} />
      <BookingScreen />
    </>
  );
}
