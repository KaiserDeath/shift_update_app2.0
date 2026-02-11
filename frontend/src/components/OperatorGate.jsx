import React from "react";
export default function OperatorGate({ setOperator }) {
  const submit = e => {
    e.preventDefault();
    const name = e.target.operator.value.trim();
    if (name) {
      sessionStorage.setItem("operator", name);
      setOperator(name);
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>Enter Operator Name</h2>
      <input name="operator" required />
      <button>Continue</button>
    </form>
  );
}
