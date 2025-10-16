import { useRef } from 'react';

const Images = () => {
  const formRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);

    const res = await fetch('http://localhost:9000/api2/create-listing', {
      method: 'POST',
      body: formData, // ✅ send FormData directly
      credentials: "include"
    });

    const data = await res.json();
    console.log('Listing created:', data);
  };

  return (
    <>
      <form ref={formRef} encType="multipart/form-data" onSubmit={handleSubmit}>
        <label htmlFor="images">Select Images: </label>
        <input type="file" id="images" name="images" multiple accept="image/*" />
        <button type="submit">Upload</button>
      </form>
    </>
  );
};

export default Images;
