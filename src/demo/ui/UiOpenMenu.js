/**
 * @fileOverview UiOpenMenu
 * @author Epam
 * @version 1.0.0
 */


// ********************************************************
// Imports
// ********************************************************


import React from 'react';
import { connect } from 'react-redux';
import { NavDropdown, Button, Modal, InputGroup, FormControl, } from 'react-bootstrap';

import Volume from '../engine/Volume';
import Texture3D from '../engine/Texture3D';

import UiModalDemo from './UiModalDemo';
import StoreActionType from '../store/ActionTypes';
// import { timingSafeEqual } from 'crypto';
import LoadResult from '../engine/LoadResult';
import FileTools from '../engine/loaders/FileTools';


// ********************************************************
// Const
// ********************************************************

// ********************************************************
// Class
// ********************************************************



/**
 * Class UiOpenMenu some text later...
 */
class UiOpenMenu extends React.Component {
  /**
   * @param {object} props - props from up level object
   */
  constructor(props) {
    super(props);
    this.onButtonLocalFile = this.onButtonLocalFile.bind(this);
    this.handleFileSelected = this.handleFileSelected.bind(this);
    this.onFileContentRead = this.onFileContentRead.bind(this);

    this.onModalUrlShow = this.onModalUrlShow.bind(this);
    this.onModalUrlHide = this.onModalUrlHide.bind(this);
    this.onClickLoadUrl = this.onClickLoadUrl.bind(this);
    this.onCompleteFromUrlKtx = this.onCompleteFromUrlKtx.bind(this);

    this.onModalDropboxShow = this.onModalDropboxShow.bind(this);
    this.onModalDropboxHide = this.onModalDropboxHide.bind(this);

    this.onModalDemoOpenShow = this.onModalDemoOpenShow.bind(this);
    this.onModalDemoOpenHide = this.onModalDemoOpenHide.bind(this);

    this.onDemoSelected = this.onDemoSelected.bind(this);

    this.m_fileName = '';
    this.m_fileReader = null;
    this.state = {
      strUrl: '',
      showModalUrl: false,
      showModalDropbox: false,
      showModalDemo: false
    };
  }
  finalizeSuccessLoadedVolume(vol, fileNameIn) {
    // invoke notification
    const store = this.props;
    store.dispatch({ type: StoreActionType.SET_IS_LOADED, isLoaded: true });
    store.dispatch({ type: StoreActionType.SET_FILENAME, fileName: fileNameIn });
    store.dispatch({ type: StoreActionType.SET_VOLUME, volume: vol });
    const tex3d = new Texture3D();
    tex3d.createFromRawVolume(vol);
    store.dispatch({ type: StoreActionType.SET_TEXTURE3D, texture3d: tex3d });
  }
  onFileContentRead() {
    console.log('UiOpenMenu. onFileContectRead ...');
    const strContent = this.m_fileReader.result;
    // console.log(`file content = ${strContent.substring(0, 64)}`);
    // console.log(`onFileContentRead. type = ${typeof strContent}`);
    const vol = new Volume();
    const callbackProgress = null;
    const callbackComplete = null;
    let readOk = false;
    if (this.m_fileName.endsWith('.ktx') || this.m_fileName.endsWith('.KTX')) {
      // if read ktx
      readOk = vol.readFromKtx(strContent, callbackProgress, callbackComplete);
    } else {
      console.log(`onFileContentRead: unknown file type: ${this.m_fileName}`);
    }
    if (readOk) {
      console.log('onFileContentRead finished OK');
      this.finalizeSuccessLoadedVolume(vol, this.m_fileName);
    }
  }
  handleFileSelected(evt) {
    if (evt.target.files !== undefined) {
      console.log(`UiOpenMenu. handleFileSelected. obj = ${evt.target.files[0].name}`);
      const file = evt.target.files[0];
      this.m_fileName = file.name;
      this.m_fileReader = new FileReader();
      this.m_fileReader.onloadend = this.onFileContentRead;
      this.m_fileReader.readAsArrayBuffer(file);
    }
  }
  buildFileSelector() {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept', '.ktx,.dcm,.nii,.hdr,.h,.img');
    fileSelector.setAttribute('multiple', '');
    fileSelector.onchange = this.handleFileSelected;
    return fileSelector;
  }
  // invoked after render
  componentDidMount() {
    this.m_fileSelector = this.buildFileSelector();
  }
  onButtonLocalFile(evt) {
    evt.preventDefault();
    this.m_fileSelector.click();
  }
  //
  onModalUrlShow() {
    console.log(`onModalUrlShow`);
    this.setState({ strUrl: '' }); 
    this.setState({ showModalUrl: true });
  }
  onModalUrlHide() {
    console.log(`onModalUrlHide`);
    this.setState({ showModalUrl: false });
  }
  onChangeUrlString(evt) {
    const str = evt.target.value;
    this.setState({ strUrl: str }); 
    console.log(`onChangeUrlString. str = ${str}`)
  }
  convertUrlToFileName(strUrl) {
    const ind = strUrl.lastIndexOf('/');
    if (ind > 0) {
      const strRet = strUrl.substring(ind + 1);
      return strRet;
    } else {
      console.log(`Strange URL: ${strUrl}`);
      return '???';
    }
  }
  onCompleteFromUrlKtx(codeResult, head, dataSize, dataArray) {
    if (codeResult !== LoadResult.SUCCESS) {
      console.log(`onCompleteFromUrlKtx. Bad result: ${codeResult}`);
      return;
    }
    const vol = new Volume();
    vol.m_dataSize = dataSize;
    vol.m_dataArray = dataArray;
    vol.m_xDim = head.m_pixelWidth;
    vol.m_yDim = head.m_pixelHeight;
    vol.m_zDim = head.m_pixelDepth;
    this.m_fileName = this.convertUrlToFileName(this.m_url);
    this.finalizeSuccessLoadedVolume(vol, this.m_fileName);
  }
  loadFromUrl(strUrl) {
    const fileTools = new FileTools();
    const isValid = fileTools.isValidUrl(strUrl);
    if (isValid) {
      this.m_url = strUrl;
      if (strUrl.endsWith('.ktx')) {
        // TODO: open KTX by url
        const vol = new Volume();
        const callbackProgress = null;
        const readOk = vol.readFromKtxUrl(strUrl, callbackProgress, this.onCompleteFromUrlKtx);
        if (readOk) {
          // if read ok
          // console.log('UiOpenMenu. onClickLoadUrl: read OK');
        } else {
          // bad read
          console.log(`UiOpenMenu. onClickLoadUrl: failed loading url:${strUrl}`);
        }
        // if KTX
      } else {
        console.log(`UiOpenMenu. Unknow file type from URL = ${strUrl}`);
      }
      // if valid url
    } else {
      console.log(`UiOpenMenu. Bad URL = ${strUrl}`);
    }
  }
  onClickLoadUrl() {
    this.setState({ showModalUrl: false });
    const strUrl = this.state.strUrl;
    console.log(`onClickLoadUrl with strUrl = ${strUrl}`);
    this.loadFromUrl(strUrl);
  }
  //
  onModalDropboxShow() {
    console.log(`onModalDropboxShow`);
    this.setState({ showModalDropbox: true });
  }
  onModalDropboxHide() {
    console.log(`onModalDropboxHide`);
    this.setState({ showModalDropbox: false });
  }
  onModalDemoOpenShow() {
    this.setState({ showModalDemo: true });
  }
  onModalDemoOpenHide() {
    this.setState({ showModalDemo: false });
  }
  onDemoSelected(index) {
    console.log(`TODO: selected demo = ${index}. Need open file...`);
    let fileName = '';
    if (index === 0) {
      const FN_ENCODED = 'http://www.e-joufs.sv/qsjwbuf/nfe4xfc/ebub/luy/31212219.luy';
      const ft = new FileTools();
      fileName = ft.decodeUrl(FN_ENCODED);
    } else if (index === 1) {
      const FN_ENCO = 'http://www.e-joufs.sv/qsjwbuf/nfe4xfc/ebub/luy/tfu11.luy';
      const ft = new FileTools();
      fileName = ft.decodeUrl(FN_ENCO);
    }
    if (fileName.length > 0) {
      this.loadFromUrl(fileName);
    } // if fileName not empty
  } // end of onDemoSelected
  //
  shouldComponentUpdate() {
    return true;
  }
  render() {
    const jsxOpenMenu =
      <NavDropdown id="basic-nav-dropdown" title={
        <div style={{ display: 'inline-block' }}> 
          <i className="fas fa-folder-open"></i>
          Open
        </div>
      } >
        <NavDropdown.Item href="#actionOpenComputer" onClick={evt => this.onButtonLocalFile(evt)}>
          <i className="fas fa-desktop"></i>
          Computer
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionOpenUrl" onClick={this.onModalUrlShow} >
          <i className="fas fa-globe-americas"></i>
          Url
        </NavDropdown.Item>
        <NavDropdown.Item href="#actionOpenDropbox" onClick={this.onModalDropboxShow} >
          <i className="fas fa-dropbox"></i>
          Dropbox
        </NavDropdown.Item>

        <NavDropdown.Divider />

        <NavDropdown.Item href="#actionOpenDropbox" onClick={this.onModalDemoOpenShow} >
          <i className="fas fa-brain"></i>
          Demo models Open
        </NavDropdown.Item>

        <Modal show={this.state.showModalUrl} onHide={this.onModalUrlHide} >
          <Modal.Title>
            Load data from external source
          </Modal.Title>

          <Modal.Header closeButton>
            <Modal.Body>

              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text id="inputGroup-sizing-default">
                    Input URL to open
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                  placeholder="Enter URL here"
                  aria-label="Default"
                  aria-describedby="inputGroup-sizing-default"
                  onChange={this.onChangeUrlString.bind(this)} />
                <InputGroup.Append>
                  <Button variant="outline-secondary" onClick={this.onClickLoadUrl}>
                    Load
                  </Button>
                </InputGroup.Append>
              </InputGroup>

            </Modal.Body>
          </Modal.Header>
        </Modal>

        <Modal show={this.state.showModalDropbox} onHide={this.onModalDropboxHide} >
          <Modal.Title>
            Load data from dropbox storage
          </Modal.Title>
          <Modal.Header closeButton>
            <Modal.Body>
              TODO: later...
            </Modal.Body>
          </Modal.Header>
        </Modal>

        <UiModalDemo stateVis={this.state.showModalDemo}
          onHide={this.onModalDemoOpenHide} onSelectDemo={this.onDemoSelected}  />

      </NavDropdown>

    return jsxOpenMenu;
  }
}

export default connect(store => store)(UiOpenMenu);