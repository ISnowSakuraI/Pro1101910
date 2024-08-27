import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Modal,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth } from "../../../firebase/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
      <Button title="เพิ่มตาราง" onPress={() => setModalVisible(true)} />
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
                <Text style={styles.buttonText}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteSchedule(item.id)}
              >
                <Text style={styles.buttonText}>ลบ</Text>
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
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "80%",
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
    textAlign: "center",
    fontSize: 14,
  },
  editButton: {
    backgroundColor: "#4CAF50",
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
    fontWeight: "bold",
  },
});
