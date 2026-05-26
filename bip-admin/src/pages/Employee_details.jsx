import React, { useState } from "react";

const Employee_details = () => {
  const [formData, setFormData] = useState({
    employee_name: "",
    emp_id: "",
    department: "",
    salary_type: "",
    date_of_joining: "",
  });

  const [employees, setEmployees] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Employee details saved successfully");

        setFormData({
          employee_name: "",
          emp_id: "",
          department: "",
          salary_type: "",
          date_of_joining: "",
        });
      } else {
        alert("Failed to save employee details");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error");
    }
  };

  const viewEmployeeDetails = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/employees");
      const data = await response.json();

      setEmployees(data);
      setShowTable(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch employee details");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Employee Details</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Employee Name</label>
        <input
          type="text"
          name="employee_name"
          value={formData.employee_name}
          onChange={handleChange}
          required
        />

        <label>Employee ID</label>
        <input
          type="text"
          name="emp_id"
          value={formData.emp_id}
          onChange={handleChange}
          required
        />

        <label>Department</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        />

        <label>Salary Type</label>
        <select
          name="salary_type"
          value={formData.salary_type}
          onChange={handleChange}
          required
        >
          <option value="">Select Salary Type</option>
          <option value="monthly">Monthly Salary</option>
          <option value="weekly">Weekly Salary</option>
          <option value="daily">Daily Salary</option>
        </select>

        <label>Date of Joining</label>
        <input
          type="date"
          name="date_of_joining"
          value={formData.date_of_joining}
          onChange={handleChange}
          required
        />

        <button type="submit">Save Employee Details</button>
      </form>

      <button onClick={viewEmployeeDetails} style={styles.viewButton}>
        View Employee Details
      </button>

      {showTable && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Department</th>
              <th>Salary Type</th>
              <th>Date of Joining</th>
            </tr>
          </thead>

          <tbody>
            {employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.employee_name}</td>
                  <td>{employee.emp_id}</td>
                  <td>{employee.department}</td>
                  <td>{employee.salary_type}</td>
                  <td>{employee.date_of_joining}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No employee records found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: "600px",
    margin: "40px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontFamily: "Arial",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  viewButton: {
    marginTop: "20px",
  },
  table: {
    width: "100%",
    marginTop: "20px",
    borderCollapse: "collapse",
  },
};

export default Employee_details;
