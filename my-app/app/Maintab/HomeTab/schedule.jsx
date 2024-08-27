import React, { useState, useEffect } from "react";
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

export default function Schedule({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newExercise, setNewExercise] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState("");
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [scheduleData, setScheduleData] = useState({});
  const [editingId, setEditingId] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      loadSchedule(user.uid);
    }
    Notifications.requestPermissionsAsync();
  }, [user]);

  const loadSchedule = async (uid) => {
    try {
      const docRef = doc(db, "schedules", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setScheduleData(docSnap.data());
      }
    } catch (error) {
      console.error("Failed to load schedule data", error);
    }
  };

  const saveSchedule = async (uid, data) => {
    try {
      await setDoc(doc(db, "schedules", uid), data);
    } catch (error) {
      console.error("Failed to save schedule data", error);
    }
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const scheduleNotification = async (exercise, time) => {
    const trigger = new Date(time);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Exercise!",
        body: `It's time for your ${exercise} session.`,
      },
      trigger,
    });
  };

  const addOrUpdateSchedule = () => {
    if (newExercise.trim() === "" || duration.trim() === "") {
      Alert.alert("Error", "กรุณาใส่ข้อมูลให้ครบถ้วน");
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
  };

  const editSchedule = (item) => {
    setNewExercise(item.exercise);
    setStartTime(new Date(`1970-01-01T${item.startTime}`));
    setDuration(item.duration);
    setEditingId(item.id);
    setModalVisible(true);
  };

  const deleteSchedule = (id) => {
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
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: {
            selected: true,
            marked: true,
            selectedColor: "blue",
          },
        }}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="pluscircle" size={24} color="white" />
        <Text style={styles.addButtonText}>เพิ่มตาราง</Text>
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
              <Text style={styles.cell}>{item.startTime}</Text>
              <Text style={styles.cell}>{item.duration} นาที</Text>
              <Text style={styles.cell}>{item.exercise}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editSchedule(item)}
              >
                <Icon name="edit" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
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
        <View style={styles.modalView}>
          <Text style={styles.modalText}>แก้ไขตารางสำหรับ {selectedDate}</Text>
          <TouchableOpacity onPress={() => setShowStartTimePicker(true)}>
            <TextInput
              style={styles.input}
              placeholder="เวลาเริ่มต้น"
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
            style={styles.input}
            placeholder="ระยะเวลา (นาที)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="การออกกำลังกาย"
            value={newExercise}
            onChangeText={setNewExercise}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={addOrUpdateSchedule}
          >
            <Text style={styles.buttonText}>บันทึก</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>ยกเลิก</Text>
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
    backgroundColor: "#f5f5f5",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontFamily: 'NotoSansThai-Regular',
    marginLeft: 5,
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
    fontFamily: 'NotoSansThai-Regular',
    textAlign: "center",
    fontSize: 14,
  },
  editButton: {
    backgroundColor: "#2196F3",
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
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
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  input: {
    fontFamily: 'NotoSansThai-Regular',
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "80%",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: 'NotoSansThai-Regular',
  },
});
