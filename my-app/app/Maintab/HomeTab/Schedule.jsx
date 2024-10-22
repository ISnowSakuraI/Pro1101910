import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth } from "../../../firebase/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import Icon from "react-native-vector-icons/AntDesign";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { useFocusEffect } from "@react-navigation/native";

export default function Schedule({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newExercise, setNewExercise] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState("");
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [scheduleData, setScheduleData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const theme = isDarkTheme ? styles.dark : styles.light;

  const user = auth.currentUser;

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadSchedule(user.uid);
      }
      Notifications.requestPermissionsAsync();
    }, [user])
  );

  const loadSchedule = useCallback(async (uid) => {
    try {
      const docRef = doc(db, "schedules", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setScheduleData(docSnap.data());
      }
    } catch (error) {
      console.error("Failed to load schedule data", error);
    }
  }, []);

  const saveSchedule = useCallback(async (uid, data) => {
    try {
      await setDoc(doc(db, "schedules", uid), data);
    } catch (error) {
      console.error("Failed to save schedule data", error);
    }
  }, []);

  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString);
  }, []);

  const scheduleNotification = useCallback(
    async (exercise, time) => {
      const trigger = new Date(time);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: isThaiLanguage ? "ถึงเวลาออกกำลังกาย!" : "Time to Exercise!",
          body: isThaiLanguage
            ? `ถึงเวลา ${exercise} ของคุณแล้ว.`
            : `It's time for your ${exercise} session.`,
        },
        trigger,
      });
    },
    [isThaiLanguage]
  );

  const addOrUpdateSchedule = useCallback(() => {
    if (newExercise.trim() === "" || duration.trim() === "") {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage ? "กรุณาใส่ข้อมูลให้ครบถ้วน" : "Please fill in all fields"
      );
      return;
    }
    const newSchedule = {
      id: editingId || Date.now().toString(),
      startTime: startTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      duration,
      exercise: newExercise,
    };
    const updatedSchedule = {
      ...scheduleData,
      [selectedDate]: [
        ...(scheduleData[selectedDate] || []).filter(
          (item) => item.id !== editingId
        ),
        newSchedule,
      ],
    };
    setScheduleData(updatedSchedule);
    if (user) {
      saveSchedule(user.uid, updatedSchedule);
    }
    setModalVisible(false);
    setNewExercise("");
    setDuration("");
    setEditingId(null);

    const notificationTime = new Date(selectedDate);
    const [hours, minutes] = newSchedule.startTime.split(":");
    notificationTime.setHours(hours, minutes);
    scheduleNotification(newExercise, notificationTime);
  }, [
    newExercise,
    duration,
    editingId,
    scheduleData,
    selectedDate,
    startTime,
    user,
    saveSchedule,
    scheduleNotification,
    isThaiLanguage,
  ]);

  const editSchedule = useCallback((item) => {
    setNewExercise(item.exercise);
    setStartTime(new Date(`1970-01-01T${item.startTime}`));
    setDuration(item.duration);
    setEditingId(item.id);
    setModalVisible(true);
  }, []);

  const deleteSchedule = useCallback((id) => {
    const updatedSchedule = {
      ...scheduleData,
      [selectedDate]: scheduleData[selectedDate].filter(
        (item) => item.id !== id
      ),
    };
    setScheduleData(updatedSchedule);
    if (user) {
      saveSchedule(user.uid, updatedSchedule);
    }
  }, [scheduleData, selectedDate, user, saveSchedule]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: {
            selected: true,
            marked: true,
            selectedColor: theme.primaryColor,
          },
        }}
        theme={{
          calendarBackground: theme.cardBackgroundColor,
          textSectionTitleColor: theme.textColor,
          dayTextColor: theme.textColor,
          todayTextColor: theme.primaryColor,
          selectedDayTextColor: theme.textColor,
          monthTextColor: theme.textColor,
          arrowColor: theme.textColor,
        }}
      />
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="pluscircle" size={24} color="white" />
        <Text style={styles.addButtonText}>
          {isThaiLanguage ? "เพิ่มตาราง" : "Add Schedule"}
        </Text>
      </TouchableOpacity>
      <FlatList
        data={(scheduleData[selectedDate] || []).sort((a, b) => {
          return (
            new Date(`1970-01-01T${a.startTime}`) -
            new Date(`1970-01-01T${b.startTime}`)
          );
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={[styles.cell, { color: theme.textColor }]}>
                {item.startTime}
              </Text>
              <Text style={[styles.cell, { color: theme.textColor }]}>
                {item.duration} {isThaiLanguage ? "นาที" : "minutes"}
              </Text>
              <Text style={[styles.cell, { color: theme.textColor }]}>
                {item.exercise}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: "#00A047" }]}
                onPress={() => editSchedule(item)}
              >
                <Icon name="edit" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: "#F44336" }]}
                onPress={() => deleteSchedule(item.id)}
              >
                <Icon name="delete" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.modalText, { color: theme.textColor }]}>
            {isThaiLanguage ? "แก้ไขตารางสำหรับ" : "Edit Schedule for"} {selectedDate}
          </Text>
          <TouchableOpacity onPress={() => setShowStartTimePicker(true)}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.textColor,
                  backgroundColor: theme.backgroundColor,
                },
              ]}
              placeholder={isThaiLanguage ? "เวลาเริ่มต้น" : "Start Time"}
              placeholderTextColor={theme.borderColor}
              value={startTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
              editable={false}
            />
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowStartTimePicker(false);
                if (time) setStartTime(time);
              }}
            />
          )}
          <TextInput
            style={[
              styles.input,
              {
                color: theme.textColor,
                backgroundColor: theme.backgroundColor,
              },
            ]}
            placeholder={isThaiLanguage ? "ระยะเวลา (นาที)" : "Duration (minutes)"}
            placeholderTextColor={theme.borderColor}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
          <TextInput
            style={[
              styles.input,
              {
                color: theme.textColor,
                backgroundColor: theme.backgroundColor,
              },
            ]}
            placeholder={isThaiLanguage ? "การออกกำลังกาย" : "Exercise"}
            placeholderTextColor={theme.borderColor}
            value={newExercise}
            onChangeText={setNewExercise}
          />
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: "#00A047" }]}
            onPress={addOrUpdateSchedule}
          >
            <Text style={styles.buttonText}>
              {isThaiLanguage ? "บันทึก" : "Save"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: "#F44336" }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>
              {isThaiLanguage ? "ยกเลิก" : "Cancel"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginHorizontal: 5,
  },
  info: {
    flex: 3,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  cell: {
    fontFamily: "NotoSansThai-Regular",
    textAlign: "center",
    fontSize: 14,
  },
  editButton: {
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  input: {
    fontFamily: "NotoSansThai-Regular",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "80%",
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    fontSize: 16,
  },
  light: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    backgroundColor: "#f0f0f0",
    textColor: "#333333",
    cardBackgroundColor: "#ffffff",
    borderColor: "#ddd",
  },
  dark: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    backgroundColor: "#212121",
    textColor: "#ffffff",
    cardBackgroundColor: "#2c2c2c",
    borderColor: "#444",
  },
});
