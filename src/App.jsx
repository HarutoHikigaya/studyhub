import { useState, useEffect } from "react";
import { auth, googleProvider, db, storage } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp,
  onSnapshot, doc, updateDoc, arrayUnion
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, Routes, Route } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("docs");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchDocs();
        fetchQuestions();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchDocs = async () => {
    const q = query(collection(db, "documents"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    setDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchQuestions = () => {
    const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>
            StudyHub.VN
          </h1>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} className="w-9 h-9 rounded-full border-2 border-white" />
              <span className="font-medium">{user.displayName.split(" ")[0]}</span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded text-sm">
                Đăng xuất
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100">
              Đăng nhập Google
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-6 py-2 font-medium transition ${activeTab === "docs" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Tài liệu
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`px-6 py-2 font-medium transition ${activeTab === "qa" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Hỏi đáp
          </button>
        </div>

        {activeTab === "docs" ? <Documents user={user} docs={docs} fetchDocs={fetchDocs} /> : <QA user={user} questions={questions} />}
      </div>
    </div>
  );
}

// === TÀI LIỆU ===
function Documents({ user, docs, fetchDocs }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleUpload = async () => {
    if (!file || !title || !subject) return alert("Vui lòng điền đủ thông tin!");
    const storageRef = ref(storage, `docs/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "documents"), {
      title, subject, url, fileName: file.name,
      uploadedBy: user.displayName, userId: user.uid,
      timestamp: serverTimestamp()
    });
    alert("Đăng tài liệu thành công!");
    setTitle(""); setSubject(""); setFile(null);
    fetchDocs();
  };

  const filtered = docs.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {user && (
        <div className="bg-white p-5 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Đăng tài liệu mới</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="Tên tài liệu" value={title} onChange={e => setTitle(e.target.value)} className="p-3 border rounded-lg" />
            <input placeholder="Môn học (VD: Toán, Lý)" value={subject} onChange={e => setSubject(e.target.value)} className="p-3 border rounded-lg" />
            <input type="file" accept=".pdf,.docx,.pptx" onChange={e => setFile(e.target.files[0])} className="p-3 border rounded-lg" />
          </div>
          <button onClick={handleUpload} className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">
            Đăng tài liệu
          </button>
        </div>
      )}

      <input
        type="text" placeholder="Tìm tài liệu..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full p-3 border rounded-lg mb-5 text-lg"
      />

      <div className="space-y-3">
        {filtered.map(doc => (
          <div key={doc.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center hover:shadow-lg transition">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{doc.title}</h3>
              <p className="text-sm text-gray-600">
                Môn: <strong>{doc.subject}</strong> • Đăng bởi: {doc.uploadedBy}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedDoc(doc)} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">
                Xem
              </button>
              <a href={doc.url} target="_blank" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">
                Tải
              </a>
            </div>
          </div>
        ))}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-xl w-full max-w-4xl h-5/6 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold">{selectedDoc.title}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-red-600 text-3xl">×</button>
            </div>
            <iframe src={selectedDoc.url} className="w-full h-full rounded" />
          </div>
        </div>
      )}
    </>
  );
}

// === HỎI ĐÁP ===
function QA({ user, questions }) {
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    let imageUrl = "";
    if (image) {
      const storageRef = ref(storage, `qa/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, "questions"), {
      question, imageUrl, answers: [],
      askedBy: user.displayName, userId: user.uid,
      timestamp: serverTimestamp()
    });
    setQuestion(""); setImage(null);
  };

  const handleAnswer = async (qid) => {
    if (!answer.trim()) return;
    await updateDoc(doc(db, "questions", qid), {
      answers: arrayUnion({
        text: answer,
        answeredBy: user.displayName,
        timestamp: new Date()
      })
    });
    setAnswer(""); setReplyTo(null);
  };

  return (
    <div>
      {user && (
        <div className="bg-white p-5 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-green-700">Đặt câu hỏi</h2>
          <textarea
            placeholder="Hỏi gì cũng được... (VD: Cho mình đáp án câu 5 đề thi Toán HK1)"
            value={question} onChange={e => setQuestion(e.target.value)}
            className="w-full p-3 border rounded-lg h-24 resize-none"
          />
          <div className="flex gap-3 mt-3">
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} className="flex-1" />
            <button onClick={handleAsk} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">
              Gửi câu hỏi
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="bg-white p-5 rounded-xl shadow">
            <div className="flex items-start gap-3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{q.question}</p>
                {q.imageUrl && <img src={q.imageUrl} className="mt-2 max-w-md rounded-lg" />}
                <p className="text-xs text-gray-500 mt-1">Hỏi bởi: {q.askedBy}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 pl-12">
              {q.answers?.map((a, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-gray-500 mt-1">Trả lời bởi: {a.answeredBy}</p>
                </div>
              ))}
            </div>

            {user && (
              <div className="mt-3 pl-12">
                {replyTo === q.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="Viết câu trả lời..." value={answer} onChange={e => setAnswer(e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    />
                    <button onClick={() => handleAnswer(q.id)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                      Gửi
                    </button>
                    <button onClick={() => { setReplyTo(null); setAnswer(""); }} className="text-gray-500">Hủy</button>
                  </div>
                ) : (
                  <button onClick={() => setReplyTo(q.id)} className="text-blue-600 text-sm hover:underline">
                    Trả lời
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
