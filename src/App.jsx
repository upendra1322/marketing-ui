// Rearranged and formatted React code
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {

  /* ---------------------- STATES ---------------------- */
  const [colleges, setColleges] = useState([]);
  const [editedData, setEditedData] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [showData, setShowData] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  /* ---------------------- LOAD EXCEL ---------------------- */
  useEffect(() => {
    fetch("/Colleges.xlsx")
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        setColleges(data);
        setEditedData(data);
        setStates([...new Set(data.map((d) => d.State))].sort());
      });
  }, []);

  /* ---------------------- UPDATE DISTRICTS ON STATE CHANGE ---------------------- */
  useEffect(() => {
    if (selectedState) {
      const filteredDistricts = [
        ...new Set(colleges.filter((d) => d.State === selectedState).map((d) => d.District)),
      ];
      setDistricts(filteredDistricts.sort());
    } else {
      setDistricts([]);
    }
  }, [selectedState, colleges]);

  /* ---------------------- FILTERED DATA ---------------------- */
  const filteredColleges = editedData.filter((college) => {
    const matchState = selectedState ? college.State === selectedState : true;
    const matchDistrict = selectedDistrict ? college.District === selectedDistrict : true;
    const matchSearch = search
      ? college.Name?.toLowerCase().includes(search.toLowerCase()) ||
        college.City?.toLowerCase().includes(search.toLowerCase())
      : true;

    return matchState && matchDistrict && matchSearch;
  });

  /* ---------------------- EDIT HANDLERS ---------------------- */
  const handleEdit = (index, field, value) => {
    const updated = [...editedData];
    updated[index][field] = value;
    setEditedData(updated);
    setIsSaved(false);
  };

  /* ---------------------- SAVE TO EXCEL ---------------------- */
  const handleSave = () => {
    setColleges(editedData);
    setIsSaved(true);

    const worksheet = XLSX.utils.json_to_sheet(editedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UpdatedColleges");
    XLSX.writeFile(workbook, "Updated_Colleges.xlsx");

    alert("✅ Changes saved & Excel downloaded");
  };

  /* ---------------------- WARN UNSAVED EXIT ---------------------- */
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

  /* ---------------------- RENDER UI ---------------------- */
  return (
    <div className="app-container">

      {/* Header */}
      <div className="header">
        <h1>College Information</h1>
      </div>

      {/* Filters */}
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
          {states.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>

        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            setShowData(false);
          }}
        >
          <option value="">Select District</option>
          {districts.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search college or city"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowData(false);
          }}
        />

        <button onClick={() => setShowData(true)}>Search</button>

        <button
          style={{
            background: isSaved ? "#4caf50" : "#f39c12",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
          }}
          onClick={handleSave}
        >
          💾 Save
        </button>
      </div>

      {/* Table Section */}
      <div className="table-container">
        {!showData ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>Select filters & click Search</p>
        ) : filteredColleges.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>No colleges found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>AISHE Code</th><th>Name</th><th>State</th><th>District</th><th>City</th>
                <th>Website</th><th>Year</th><th>Location</th><th>Type</th>
                <th>Management</th><th>University</th><th>Category</th><th>Email</th><th>Phone</th>
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

                  {/* Website column */}
                  <td>
                    {(() => {
                      let site = college.Website?.trim();
                      if (!site) return "No Website";

                      site = site.replace(/\/+$/, "");
                      const httpsUrl = site.startsWith("http") ? site : `https://${site}`;
                      const httpUrl = site.startsWith("http") ? site.replace("https://", "http://") : `http://${site}`;

                      return (
                        <a
                          href={httpsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            fetch(httpsUrl)
                              .then((r) => { if (!r.ok) throw new Error(); })
                              .catch(() => {
                                window.open(httpUrl, "_blank");
                                e.preventDefault();
                              });
                          }}
                          style={{ color: "#007bff", textDecoration: "underline" }}
                        >
                          {site}
                        </a>
                      );
                    })()}
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
                      value={editedData[index]?.Email ?? ""}
                      onChange={(e) => handleEdit(index, "Email", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      value={editedData[index]?.["Phone No"] ?? ""}
                      onChange={(e) => handleEdit(index, "Phone No", e.target.value)}
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
