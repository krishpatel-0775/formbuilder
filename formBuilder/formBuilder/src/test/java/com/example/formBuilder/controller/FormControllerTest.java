package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.enums.FormStatus;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.service.FormService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FormController.class)
@AutoConfigureMockMvc(addFilters = false)
public class FormControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FormService formService;

    @Autowired
    private ObjectMapper objectMapper;

    private Form form;
    private FormListDto formListDto;

    private static final UUID TEST_UUID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String TEST_UUID_STR = TEST_UUID.toString();

    @BeforeEach
    void setUp() {
        form = new Form();
        form.setId(TEST_UUID);
        form.setFormName("Test Form");
        form.setStatus(FormStatus.DRAFT);

        formListDto = new FormListDto(TEST_UUID, "Test Form", FormStatus.DRAFT);
    }

    @Test
    void getAllForms_ShouldReturnList() throws Exception {
        when(formService.getAllForms()).thenReturn(List.of(formListDto));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].formName").value("Test Form"));
    }

    @Test
    void createForm_ShouldReturnSuccess() throws Exception {
        FormRequest req = new FormRequest();
        req.setFormName("New Form");
        
        when(formService.createForm(any(FormRequest.class))).thenReturn("Form Created Successfully");

        mockMvc.perform(post(AppConstants.API_BASE_FORMS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Form Created Successfully"));
    }

    @Test
    void getForm_ShouldReturnForm() throws Exception {
        when(formService.getFormById(TEST_UUID)).thenReturn(form);

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(TEST_UUID_STR));
    }

    @Test
    void getFormData_ShouldReturnPagedData() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("content", new ArrayList<>());
        mockResponse.put("totalElements", 0);
        
        when(formService.getAllDataFromTable(eq(TEST_UUID), isNull(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(mockResponse);

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR + "/data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void publishForm_ShouldReturnSuccess() throws Exception {
        when(formService.publishForm(TEST_UUID)).thenReturn("Form Published Successfully");

        mockMvc.perform(post(AppConstants.API_BASE_FORMS + "/publish/" + TEST_UUID_STR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Form Published Successfully"));
    }

    @Test
    void getLookupValues_ShouldReturnList() throws Exception {
        Map<String, Object> val1 = new HashMap<>();
        val1.put("id", TEST_UUID_STR);
        val1.put("value", "Value1");
        Map<String, Object> val2 = new HashMap<>();
        val2.put("id", UUID.randomUUID().toString());
        val2.put("value", "Value2");
        
        when(formService.getLookupValues(TEST_UUID, "name")).thenReturn(List.of(val1, val2));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR + "/lookup/name"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].value").value("Value1"));
    }

    @Test
    void updateForm_ShouldReturnSuccess() throws Exception {
        UpdateFormRequest req = new UpdateFormRequest();
        req.setFormName("Updated Name");

        when(formService.updateForm(eq(TEST_UUID), any(UpdateFormRequest.class))).thenReturn("Form updated successfully");

        mockMvc.perform(put(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Form updated successfully"));
    }

    @Test
    void getFormRules_ShouldReturnRules() throws Exception {
        when(formService.getFormRules(TEST_UUID)).thenReturn("[]");

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR + "/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("[]"));
    }

    @Test
    void saveFormRules_ShouldReturnSuccess() throws Exception {
        List<FormRuleDTO> rules = new ArrayList<>();
        
        when(formService.saveFormRules(eq(TEST_UUID), anyList())).thenReturn("Rules saved successfully");

        mockMvc.perform(post(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR + "/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rules)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Rules saved successfully"));
    }

    @Test
    void getForm_NotFound_ShouldReturn404() throws Exception {
        UUID missingId = UUID.fromString("99999999-9999-9999-9999-999999999999");
        when(formService.getFormById(missingId)).thenThrow(new ResourceNotFoundException("Form not found"));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/" + missingId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Form not found"));
    }

    @Test
    void createForm_ValidationError_ShouldReturn400() throws Exception {
        FormRequest req = new FormRequest();
        when(formService.createForm(any(FormRequest.class))).thenThrow(new ValidationException("Invalid form"));

        mockMvc.perform(post(AppConstants.API_BASE_FORMS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("VE: Invalid form"));
    }

    @Test
    void getLookupValues_InvalidColumn_ShouldReturn400() throws Exception {
        when(formService.getLookupValues(eq(TEST_UUID), anyString())).thenThrow(new IllegalArgumentException("Invalid column name"));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/" + TEST_UUID_STR + "/lookup/drop;table"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("IAE: Invalid column name"));
    }
}
