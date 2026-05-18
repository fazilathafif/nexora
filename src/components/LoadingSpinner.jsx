export default function LoadingSpinner() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0A0A14',flexDirection:'column',gap:16}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid #1E293B',borderTopColor:'#0D9488',animation:'spin 0.8s linear infinite'}} />
      <div style={{fontSize:13,color:'#475569',fontFamily:'Inter,sans-serif'}}>Loading Nexora…</div>
    </div>
  )
}
