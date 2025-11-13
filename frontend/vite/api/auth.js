export const login = async({email,password})=>{
    const res = await fetch("http://localhost:3000/login", {
        headers:{
            "Content-Type":"application/json"
        },
        method:"POST",
        body:JSON.stringify({email,password})
    })
    return res.json();
}
