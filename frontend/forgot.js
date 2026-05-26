const emailinput = document.querySelector("#email");
const submitbttn = document.querySelector("#submit");
const resulttext = document.querySelector("#result");

submitbttn.addEventListener("click", async function (params) {
    const email = emailinput.value;
    if(!email){
        resulttext.textContent = "Write the email"; return;
    }
try{
    const res = await fetch("http://localhost:3000/forgotpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, email }),
    });
    const data = await res.json();
    resulttext.textContent =  data.message; 
    
}catch(err){
   resulttext.textContent = "Server Error";
   console.error(err);
}})
