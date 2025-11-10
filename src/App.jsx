import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./App.css";

function App() {
  const [baseData, setBaseData] = useState([]); // Raw CSV rows with IDs (no merged edits)
  const [colleges, setColleges] = useState([]); // Merged rows (CSV + saved edits)
  const [editedData, setEditedData] = useState([]); // Current working copy (editable)
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [showData, setShowData] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const EDITS_KEY = "collegeEdits"; // only store edits to avoid quota issues

  const generateRowId = (item, index) => {
    const aishe = (item["AISHE Code"] || "").trim();
    if (aishe) return `aishe-${aishe}`;
    const name = (item.Name || "").trim().toLowerCase();
    const state = (item.State || "").trim().toLowerCase();
    const district = (item.District || "").trim().toLowerCase();
    const city = (item.City || "").trim().toLowerCase();
    const website = (item.Website || "").trim().toLowerCase();
    const composite = `${name}|${state}|${district}|${city}|${website}`;
    return composite !== "||||" ? `key-${composite}` : `clg-${index + 1}`;
  };

  const mergeEdits = (rows, editsMap) => {
    if (!editsMap || typeof editsMap !== "object") return rows;
    return rows.map((row) => {
      const edit = editsMap[row.id];
      if (!edit) return row;
      return {
        ...row,
        Email: edit.Email !== undefined ? edit.Email : row.Email,
        ["Phone No"]: edit["Phone No"] !== undefined ? edit["Phone No"] : row["Phone No"],
      };
    });
  };

  // Load CSV and merge saved edits (do NOT store full dataset in localStorage)
  useEffect(() => {
    fetch("/Colleges.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const withIds = results.data.map((item, index) => ({
              id: generateRowId(item, index),
              ...item,
            }));
            // Console log sample rows for verification
            console.log("[College Information] Parsed CSV sample:", withIds.slice(0, 3));

            setBaseData(withIds);

            const savedEdits = JSON.parse(localStorage.getItem(EDITS_KEY) || "{}");
            const merged = mergeEdits(withIds, savedEdits);

            setColleges(merged);
            setEditedData(merged);

            const uniqueStates = [
              ...new Set(merged.map((d) => d.State).filter(Boolean)),
            ].sort();
            setStates(uniqueStates);
          },
        });
      })
      .catch((err) => console.error("Error loading CSV:", err));
  }, []);

  // Update districts when state selected
  useEffect(() => {
    if (selectedState) {
      const filteredDistricts = [
        ...new Set(
          colleges
            .filter((d) => d.State === selectedState)
            .map((d) => d.District)
            .filter((v) => v !== undefined && v !== null && v !== "")
        ),
      ].sort();
      setDistricts(filteredDistricts);
    } else {
      setDistricts([]);
    }
  }, [selectedState, colleges]);

  // Filter logic
  const filteredColleges = editedData.filter((college) => {
    const matchState = selectedState ? college.State === selectedState : true;
    const matchDistrict = selectedDistrict
      ? college.District === selectedDistrict
      : true;
    const q = search.trim().toLowerCase();
    const matchSearch = q
      ? (college.Name || "").toLowerCase().includes(q) ||
        (college.City || "").toLowerCase().includes(q)
      : true;
    return matchState && matchDistrict && matchSearch;
  });

  // Edit Email / Phone locally
  const handleEdit = (id, field, value) => {
    setEditedData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setIsSaved(false);
  };

  // Save only the changes (Email, Phone No) to localStorage, not the full dataset
  const handleSave = () => {
    const existingEdits = JSON.parse(localStorage.getItem(EDITS_KEY) || "{}");

    // Build a map of edits by comparing editedData to baseData (original CSV without merged edits)
    const baseById = new Map(baseData.map((r) => [r.id, r]));
    const newEdits = { ...existingEdits };

    for (const row of editedData) {
      const baseRow = baseById.get(row.id) || {};
      const email = (row.Email || "").trim();
      const phone = (row["Phone No"] || "").trim();
      const baseEmail = (baseRow.Email || "").trim();
      const basePhone = (baseRow["Phone No"] || "").trim();

      const changedEmail = email !== baseEmail;
      const changedPhone = phone !== basePhone;

      if (changedEmail || changedPhone) {
        newEdits[row.id] = {
          Email: email,
          ["Phone No"]: phone,
        };
      } else {
        // If no difference from CSV base, remove any stored edit to keep storage lean
        if (newEdits[row.id]) {
          delete newEdits[row.id];
        }
      }
    }

    try {
      localStorage.setItem(EDITS_KEY, JSON.stringify(newEdits));
      setIsSaved(true);
      alert("✅ Changes saved successfully! Data stored permanently in browser.");
    } catch (e) {
      console.error("Failed to save edits to localStorage:", e);
      alert("Failed to save changes due to storage limits.");
    }

    // Keep in-memory merged data in sync
    const merged = mergeEdits(baseData, newEdits);
    setColleges(merged);
    setEditedData(merged);
  };

  // Warn user before leaving if unsaved changes
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
      {/* 🏫 Header */}
      <div className="header">
        <h1>College Information</h1>
      </div>

      {/* 🟢 Filters */}
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
          {states.map((s) => (
            <option key={s} value={s}>
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
          {districts.map((d) => (
            <option key={d} value={d}>
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

        <button onClick={() => setShowData(true)}>Search</button>

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

      {/* 🟢 Table */}
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
                <th>Phone No</th>
              </tr>
            </thead>
            <tbody>
              {filteredColleges.map((college) => (
                <tr key={college.id}>
                  <td>{college["AISHE Code"]}</td>
                  <td>{college.Name}</td>
                  <td>{college.State}</td>
                  <td>{college.District}</td>
                  <td>{college.City}</td>
                  <td>
                    {(() => {
                      const raw = (college.Website ?? "").toString().trim();
                      const lower = raw.toLowerCase();
                      const invalidList = ["na", "n/a", "not available", "none", "—", "-"];
                      const invalid = !raw || invalidList.includes(lower);
                      if (invalid) return "—";

                      let href = raw;
                      if (!/^https?:\/\//i.test(href)) {
                        href = `https://${href}`;
                      }

                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#00bfff", textDecoration: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {raw}
                        </a>
                      );
                    })()}
                  </td>
                  <td>{college.Year}</td>
                  <td>{college.Location}</td>
                  <td>{college.Type}</td>
                  <td>{college.Management}</td>
                  <td>{college.University}</td>
                  <td>{college.Category}</td>
                  <td>
                    <input
                      type="text"
                      value={college.Email || ""}
                      onChange={(e) =>
                        handleEdit(college.id, "Email", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={college["Phone No"] || ""}
                      onChange={(e) =>
                        handleEdit(college.id, "Phone No", e.target.value)
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