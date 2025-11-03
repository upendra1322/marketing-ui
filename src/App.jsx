import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [colleges, setColleges] = useState([]);
  const [editedData, setEditedData] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [showData, setShowData] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // 🟢 Load Excel Data
  useEffect(() => {
    fetch("/Colleges.xlsx")
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        setColleges(data);
        setEditedData(data);
        const uniqueStates = [...new Set(data.map((d) => d.State))];
        setStates(uniqueStates.sort());
      });
  }, []);

  // 🟢 Update districts when state selected
  useEffect(() => {
    if (selectedState) {
      const filteredDistricts = [
        ...new Set(
          colleges
            .filter((d) => d.State === selectedState)
            .map((d) => d.District)
        ),
      ];
      setDistricts(filteredDistricts.sort());
    } else {
      setDistricts([]);
    }
  }, [selectedState, colleges]);

  // 🟢 Filter logic
  const filteredColleges = editedData.filter((college) => {
    const matchState = selectedState ? college.State === selectedState : true;
    const matchDistrict = selectedDistrict
      ? college.District === selectedDistrict
      : true;
    const matchSearch = search
      ? college.Name?.toLowerCase().includes(search.toLowerCase()) ||
        college.City?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchState && matchDistrict && matchSearch;
  });

  // 🟢 Edit Email / Phone locally
  const handleEdit = (index, field, value) => {
    const updated = [...editedData];
    updated[index][field] = value;
    setEditedData(updated);
    setIsSaved(false);
  };

  // 🟢 Search Button
  const handleSearchClick = () => {
    setShowData(true);
  };

  // 🟢 Save Button Logic
  const handleSave = () => {
    setColleges(editedData);
    setIsSaved(true);
    alert("✅ Changes saved successfully!");
  };

  // 🟢 Warn user before leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSaved]);

  return (
    <div className="app-container">
      {/* 🏫 Professional Header */}
      <div className="header">
        <h1>College Information</h1>
      </div>

      {/* 🟢 Filter Section */}
      <div className="filters">
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedDistrict("");
            setShowData(false);
          }}
        >
          <option value="">Select State</option>
          {states.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            setShowData(false);
          }}
        >
          <option value="">Select District</option>
          {districts.map((d, i) => (
            <option key={i} value={d}>
              {d}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by college or city"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowData(false);
          }}
        />

        <button onClick={handleSearchClick}>Search</button>
        <button
          className="save-btn"
          style={{
            background: isSaved ? "#4CAF50" : "#f39c12",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={handleSave}
        >
          💾 Save
        </button>
      </div>

      {/* 🟢 Table Section */}
      <div className="table-container">
        {!showData ? (
          <p style={{ color: "#aaa", textAlign: "center", padding: "10px" }}>
            Select filters and click Search to view data
          </p>
        ) : filteredColleges.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center", padding: "10px" }}>
            No colleges found for your selection
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>AISHE Code</th>
                <th>Name</th>
                <th>State</th>
                <th>District</th>
                <th>City</th>
                <th>Website</th>
                <th>Year</th>
                <th>Location</th>
                <th>Type</th>
                <th>Management</th>
                <th>University</th>
                <th>Category</th>
                <th>Email</th>
                <th>Phone No.</th>
              </tr>
            </thead>
            <tbody>
              {filteredColleges.map((college, index) => (
                <tr key={index}>
                  <td>{college["AISHE Code"]}</td>
                  <td>{college.Name}</td>
                  <td>{college.State}</td>
                  <td>{college.District}</td>
                  <td>{college.City}</td>
                  <td>
                    <a
                      href={college.Website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#00bfff" }}
                    >
                      {college.Website}
                    </a>
                  </td>
                  <td>{college["Year of Establishment"]}</td>
                  <td>{college.Location}</td>
                  <td>{college.Type}</td>
                  <td>{college.Management}</td>
                  <td>{college.University}</td>
                  <td>{college.Category}</td>
                  <td>
                    <input
                      type="text"
                      value={college.Email || ""}
                      onChange={(e) => handleEdit(index, "Email", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={college["Phone No"] || ""}
                      onChange={(e) =>
                        handleEdit(index, "Phone No", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;