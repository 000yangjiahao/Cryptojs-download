import React, { useEffect, useState } from 'react';
import streamSaver from 'streamsaver';
import CryptoJS from 'crypto-js';
import { Select, Button, Progress } from 'antd';

var key = '30980f98296b77f00a55f3c92b35322d898ae2ffcdb906de40336d2cf3d556a0';
key = CryptoJS.enc.Hex.parse(key);
const iv = CryptoJS.enc.Hex.parse('e5889166bb98ba01e1a6bc9b32dbf3e6');

function App() {
  const [select, setSelect] = useState('/download/encrypt_sample.jpg')
  const [part1, format] = select.split('.')
  const [progress, setProgress] = useState(0)
  const [fileTime, setFileTime] = useState(0)
  const [decryptTime, setDecryptTime] = useState(0)
  let sovled = 0
  const downloadFile = () => {
    setProgress(0)
    setFileTime(0)
    setDecryptTime(0)
    const fileStream = streamSaver.createWriteStream('demo.' + format); // 创建文件写入流
    const writer = fileStream.getWriter(); // 获取写入器
    const startTime = performance.now();
    fetch(select).then(response => {
      const decryptStartTime = performance.now()
      const reader = response.body.getReader()
      let offset = 0
      const totalLength = response.headers.get('content-length')
      const processChunk = async ({ done, value }) => {
        if (done) {
          writer.close(); // 关闭写入器
          const endTime = performance.now();
          const totalTime = (endTime - startTime) / 1000; // 计算总共耗时（秒）
          setFileTime(totalTime.toFixed(3))
          setProgress(100)
          return;
        }

        // 假设你要舍弃文件的前1kb，修改文件的1kb到2kb
        if (offset === 0 && value.length > 2064) {
          value = modifyChunk(value);
        } else if (offset === 0 && value.length < 2064) {
          const decryptedPart = value.slice(1024, value.length)
          const wordArray = ArrayBufferToWordArray(decryptedPart.buffer)
          const decryptedData = CryptoJS.AES.decrypt({ ciphertext: wordArray }, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
          value = WordArrayToArrayBuffer(decryptedData)
        }

        // 写入数据
        await writer.write(value);

        offset = 1;

        sovled += value.length
        setProgress(((sovled / totalLength) * 100).toFixed(2))

        return reader.read().then(processChunk).catch(error => {
          console.error('读取文件时发生错误：', error);
          writer.abort();
        });;
      };

      reader.read().then(processChunk);

      function modifyChunk(chunk) {
        const decryptedPart = chunk.slice(1024, 2064)
        const retainPart = chunk.slice(2064)
        const wordArray = ArrayBufferToWordArray(decryptedPart.buffer)
        const decryptedData = CryptoJS.AES.decrypt({ ciphertext: wordArray }, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        const newU8 = WordArrayToArrayBuffer(decryptedData)
        const mergedArray = new Uint8Array(1024 + retainPart.length)
        mergedArray.set(newU8, 0)
        mergedArray.set(retainPart, 1024)
        const decryptEndTime = performance.now(); // 记录解密结束时间
        const decryptionTime = (decryptEndTime - decryptStartTime) / 1000; // 计算解密耗时（秒）
        setDecryptTime(decryptionTime.toFixed(3))
        return mergedArray
      }

      const ArrayBufferToWordArray = arrayBuffer => {
        const u8 = new Uint8Array(arrayBuffer, 0, arrayBuffer.byteLength);
        const len = u8.length;
        const words = [];
        for (let i = 0; i < len; i += 1) {
          words[i >>> 2] |= (u8[i] & 0xff) << (24 - (i % 4) * 8);
        }
        return CryptoJS.lib.WordArray.create(words, len);
      }

      const WordArrayToArrayBuffer = wordArray => {
        const { words } = wordArray;
        const { sigBytes } = wordArray;
        const u8 = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; i += 1) {
          const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          u8[i] = byte;
        }
        return u8;
      }

    }).catch(error => {
      console.error('下载文件时发生错误：', error);
    });
  };

  return (
    <div>
      <h1>File Download and Processing</h1>
      <p>This is a React app for downloading and processing files.</p>
      <Select value={select} onChange={(value) => setSelect(value)} options={[
        { value: '/download/encrypt_sample.jpg', label: '79KB JPG' },
        { value: '/download/encrypt_1G.mp4', label: '1GB mp4' },
        { value: '/download/encrypt_film.mkv', label: '15GB mkv' },
      ]} />
      <Button type='primary' onClick={downloadFile} style={{ marginLeft: 24 }}>下载</Button>
      <div style={{ margin: 24 }}>
        <Progress percent={progress} type="circle" />
      </div>
      <div>
        在解密 / 下载 完成后将显示耗时信息。
        {decryptTime != 0 && <div>解密一共耗时：{decryptTime} 秒</div>}
        {fileTime != 0 && <div>文件下载一共耗时：{fileTime} 秒</div>}
      </div>
    </div>
  );
}

export default App;